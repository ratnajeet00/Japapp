import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  ScrollView, Alert, Switch, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { isSpeechAvailable, getAvailableVoices } from '../services/textToSpeech';

const ProfileScreen = () => {
  const [stats, setStats] = useState({
    totalKanji: 0,
    learnedKanji: 0,
    totalKatakana: 0,
    learnedKatakana: 0,
    totalWords: 0,
    learnedWords: 0,
  });
  
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState([]);
  const [japaneseVoices, setJapaneseVoices] = useState([]);
  
  // Load user data and settings
  useEffect(() => {
    loadUserData();
    loadSettings();
    checkSpeechAvailability();
    loadAvailableVoices();
  }, []);
  
  // Check if speech synthesis is available
  const checkSpeechAvailability = async () => {
    try {
      const available = await isSpeechAvailable();
      setSpeechEnabled(available);
    } catch (error) {
      console.error('Error checking speech availability:', error);
      setSpeechEnabled(false);
    }
  };
  
  // Load all user data to calculate statistics
  const loadUserData = async () => {
    try {
      setLoading(true);
      // Load Kanji data
      const kanjiData = await AsyncStorage.getItem('kanjiList');
      const parsedKanji = kanjiData ? JSON.parse(kanjiData) : [];
      
      // Load Katakana data
      const katakanaData = await AsyncStorage.getItem('katakanaList');
      const parsedKatakana = katakanaData ? JSON.parse(katakanaData) : [];
      
      // Load Words data
      const wordsData = await AsyncStorage.getItem('wordsList');
      const parsedWords = wordsData ? JSON.parse(wordsData) : [];
      
      // Calculate statistics
      setStats({
        totalKanji: parsedKanji.length,
        learnedKanji: parsedKanji.filter(k => k.level > 0).length,
        totalKatakana: parsedKatakana.length,
        learnedKatakana: parsedKatakana.filter(k => k.level > 0).length,
        totalWords: parsedWords.length,
        learnedWords: parsedWords.filter(w => w.level > 0).length,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };
  
  // Load user settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setDarkMode(parsedSettings.darkMode || false);
        setAutoPlayAudio(parsedSettings.autoPlayAudio !== false); // Default to true
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  // Save user settings to AsyncStorage
  const saveSettings = async (key, value) => {
    try {
      // Get current settings
      const settings = await AsyncStorage.getItem('userSettings');
      const parsedSettings = settings ? JSON.parse(settings) : {};
      
      // Update the specific setting
      parsedSettings[key] = value;
      
      // Save back to storage
      await AsyncStorage.setItem('userSettings', JSON.stringify(parsedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };
  
  // Toggle dark mode setting
  const toggleDarkMode = (value) => {
    setDarkMode(value);
    saveSettings('darkMode', value);
  };
  
  // Toggle auto-play audio setting
  const toggleAutoPlayAudio = (value) => {
    setAutoPlayAudio(value);
    saveSettings('autoPlayAudio', value);
  };
  
  // Reset all progress (with confirmation)
  const resetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset kanji progress
              const kanjiData = await AsyncStorage.getItem('kanjiList');
              if (kanjiData) {
                const parsedKanji = JSON.parse(kanjiData);
                const resetKanji = parsedKanji.map(k => ({...k, level: 0}));
                await AsyncStorage.setItem('kanjiList', JSON.stringify(resetKanji));
              }
              
              // Reset katakana progress
              const katakanaData = await AsyncStorage.getItem('katakanaList');
              if (katakanaData) {
                const parsedKatakana = JSON.parse(katakanaData);
                const resetKatakana = parsedKatakana.map(k => ({...k, level: 0}));
                await AsyncStorage.setItem('katakanaList', JSON.stringify(resetKatakana));
              }
              
              // Reset words progress (or remove words altogether)
              await AsyncStorage.removeItem('wordsList');
              
              // Update statistics
              loadUserData();
              
              Alert.alert('Progress Reset', 'All your learning progress has been reset.');
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Load available TTS voices
  const loadAvailableVoices = async () => {
    try {
      const { allVoices, japaneseVoices } = await getAvailableVoices();
      setVoices(allVoices || []);
      setJapaneseVoices(japaneseVoices || []);
      
      // Log voice info for debugging
      console.log(`Found ${allVoices?.length || 0} total voices and ${japaneseVoices?.length || 0} Japanese voices`);
      
      // Store selected voice only if voices are available
      if (japaneseVoices && japaneseVoices.length > 0) {
        // If user hasn't selected a voice yet, use the first Japanese voice
        const settings = await AsyncStorage.getItem('userSettings');
        const parsedSettings = settings ? JSON.parse(settings) : {};
        
        if (!parsedSettings.selectedVoiceId && japaneseVoices.length > 0) {
          saveSettings('selectedVoiceId', japaneseVoices[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading TTS voices:', error);
      setVoices([]);
      setJapaneseVoices([]);
    }
  };

  // Add TTS diagnostic information section after the settings section in the render
  const renderTTSDiagnostics = () => {
    return (
      <View style={styles.debugSection}>
        <Text style={styles.sectionTitle}>TTS Diagnostics</Text>
        
        <Text style={styles.debugText}>
          Speech Available: {speechEnabled ? "Yes" : "No"}
        </Text>
        
        <Text style={styles.debugText}>
          Total Voices: {voices ? voices.length : "Not supported in this Expo version"}
        </Text>
        
        <Text style={styles.debugText}>
          Japanese Voices: {japaneseVoices ? japaneseVoices.length : "Not supported"}
        </Text>
        
        {japaneseVoices && japaneseVoices.length > 0 && (
          <View style={styles.voicesList}>
            <Text style={styles.debugSubtitle}>Available Japanese Voices:</Text>
            {japaneseVoices.map((voice, index) => (
              <Text key={index} style={styles.voiceItem}>
                • {voice.name || voice.id} ({voice.quality || "standard"})
              </Text>
            ))}
          </View>
        )}
        
        {speechEnabled && (!japaneseVoices || japaneseVoices.length === 0) && (
          <Text style={styles.infoText}>
            Your device supports TTS but detailed voice information is not available.
            Japanese speech should still work using the system default voice.
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color="#4B0082" />
        <Text style={styles.headerText}>Japanese Learner</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={36} color="#4B0082" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      ) : (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Learning Statistics</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.learnedKanji}</Text>
              <Text style={styles.statLabel}>Kanji Learned</Text>
              <Text style={styles.statTotal}>of {stats.totalKanji}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.learnedKatakana}</Text>
              <Text style={styles.statLabel}>Katakana Learned</Text>
              <Text style={styles.statTotal}>of {stats.totalKatakana}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.learnedWords}</Text>
              <Text style={styles.statLabel}>Words Learned</Text>
              <Text style={styles.statTotal}>of {stats.totalWords}</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              Total Progress: {stats.totalKanji + stats.totalKatakana + stats.totalWords > 0 
                ? Math.round(((stats.learnedKanji + stats.learnedKatakana + stats.learnedWords) / 
                  (stats.totalKanji + stats.totalKatakana + stats.totalWords)) * 100) 
                : 0}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${stats.totalKanji + stats.totalKatakana + stats.totalWords > 0 
                      ? Math.round(((stats.learnedKanji + stats.learnedKatakana + stats.learnedWords) / 
                        (stats.totalKanji + stats.totalKatakana + stats.totalWords)) * 100) 
                      : 0}%` 
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            trackColor={{ false: "#dddddd", true: "#8a56ac" }}
            thumbColor={darkMode ? "#4B0082" : "#f4f3f4"}
            ios_backgroundColor="#dddddd"
            onValueChange={toggleDarkMode}
            value={darkMode}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto-play Audio</Text>
          <Switch
            trackColor={{ false: "#dddddd", true: "#8a56ac" }}
            thumbColor={autoPlayAudio ? "#4B0082" : "#f4f3f4"}
            ios_backgroundColor="#dddddd"
            onValueChange={toggleAutoPlayAudio}
            value={autoPlayAudio}
            disabled={!speechEnabled}
          />
        </View>
        
        {!speechEnabled && (
          <Text style={styles.warningText}>
            Text-to-speech is not available on your device.
          </Text>
        )}
        
        <TouchableOpacity style={styles.dangerButton} onPress={resetProgress}>
          <Text style={styles.dangerButtonText}>Reset All Progress</Text>
        </TouchableOpacity>
      </View>
      
      {renderTTSDiagnostics()}
      
      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Japanese Learning App v1.0.0
        </Text>
        <Text style={styles.aboutText}>
          This app helps you learn Japanese through Kanji, Katakana, and common words.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#4B0082',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
  },
  statTotal: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  progressSection: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4B0082',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  warningText: {
    color: '#ff6347',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: '#ff6347',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  aboutSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 30,
  },
  aboutText: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  debugSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  debugText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  debugSubtitle: {
    color: '#4B0082', 
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  },
  voicesList: {
    marginTop: 5,
  },
  voiceItem: {
    color: '#555',
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 3,
  },
  infoText: {
    color: '#4B0082',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
    fontStyle: 'italic'
  },
});

export default ProfileScreen;
