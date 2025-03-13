import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  Modal, ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { fetchKatakanaInfo, downloadKatakanaData } from '../services/groqApi';
import { speakJapanese, stopSpeaking } from '../services/textToSpeech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

// Initial Katakana list
const initialKatakanaList = [
  { character: 'ア', romanji: 'a', level: 0 },
  { character: 'イ', romanji: 'i', level: 0 },
  { character: 'ウ', romanji: 'u', level: 0 },
  { character: 'エ', romanji: 'e', level: 0 },
  { character: 'オ', romanji: 'o', level: 0 },
  { character: 'カ', romanji: 'ka', level: 0 },
  { character: 'キ', romanji: 'ki', level: 0 },
  { character: 'ク', romanji: 'ku', level: 0 },
  { character: 'ケ', romanji: 'ke', level: 0 },
  { character: 'コ', romanji: 'ko', level: 0 },
  // Add more katakana
];

const KatakanaScreen = () => {
  const [katakanaList, setKatakanaList] = useState([]);
  const [selectedKatakana, setSelectedKatakana] = useState(null);
  const [katakanaDetails, setKatakanaDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  useEffect(() => {
    // Load katakana list and progress from AsyncStorage
    const loadKatakanaData = async () => {
      try {
        const storedKatakana = await AsyncStorage.getItem('katakanaList');
        if (storedKatakana !== null) {
          setKatakanaList(JSON.parse(storedKatakana));
        } else {
          setKatakanaList(initialKatakanaList);
          await AsyncStorage.setItem('katakanaList', JSON.stringify(initialKatakanaList));
        }
      } catch (error) {
        console.error('Error loading katakana data:', error);
        setKatakanaList(initialKatakanaList);
      }
    };
    
    loadKatakanaData();
  }, []);

  // Pull to refresh - download new katakana data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Download fresh katakana data
      const newKatakana = await downloadKatakanaData();
      
      // Merge with existing katakana data (keeping progress for existing katakana)
      const storedKatakana = await AsyncStorage.getItem('katakanaList');
      let existingKatakana = storedKatakana ? JSON.parse(storedKatakana) : [];
      
      // Create a map of existing katakana for quick lookup
      const katakanaMap = {};
      existingKatakana.forEach(k => {
        katakanaMap[k.character] = k;
      });
      
      // Merge new katakana with existing data
      const mergedKatakana = newKatakana.map(k => {
        return katakanaMap[k.character] ? katakanaMap[k.character] : k;
      });
      
      // Save and update state
      await AsyncStorage.setItem('katakanaList', JSON.stringify(mergedKatakana));
      setKatakanaList(mergedKatakana);
      
      Alert.alert("Success", "Katakana data updated successfully!");
    } catch (error) {
      console.error('Error refreshing katakana data:', error);
      Alert.alert("Error", "Failed to update katakana data. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle downloading all katakana data
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const newKatakana = await downloadKatakanaData();
      
      // Merge with existing katakana data (keeping progress for existing katakana)
      const storedKatakana = await AsyncStorage.getItem('katakanaList');
      let existingKatakana = storedKatakana ? JSON.parse(storedKatakana) : [];
      
      // Create a map of existing katakana for quick lookup
      const katakanaMap = {};
      existingKatakana.forEach(k => {
        katakanaMap[k.character] = k;
      });
      
      // Merge new katakana with existing data
      const mergedKatakana = newKatakana.map(k => {
        return katakanaMap[k.character] ? katakanaMap[k.character] : k;
      });
      
      // Save and update state
      await AsyncStorage.setItem('katakanaList', JSON.stringify(mergedKatakana));
      setKatakanaList(mergedKatakana);
      
      Alert.alert("Success", "Katakana data downloaded successfully!");
    } catch (error) {
      console.error('Error downloading katakana data:', error);
      Alert.alert("Error", "Failed to download katakana data. Please check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Speak the katakana using TTS
  const handleSpeak = (text, meaning = '') => {
    speakJapanese(text);
    if (meaning) {
      // After speaking the Japanese, speak the English meaning with a pause
      setTimeout(() => {
        speakJapanese(meaning, { language: 'en-US' });
      }, 1000);
    }
  };

  const handleKatakanaSelect = async (katakana) => {
    setSelectedKatakana(katakana);
    setModalVisible(true);
    setLoading(true);
    
    try {
      // Fetch katakana details from GROQ API
      const details = await fetchKatakanaInfo(katakana.character);
      setKatakanaDetails(JSON.parse(details));
    } catch (error) {
      console.error('Error fetching katakana details:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsLearned = async () => {
    try {
      if (selectedKatakana) {
        // Update katakana level
        const updatedList = katakanaList.map((item) => 
          item.character === selectedKatakana.character ? { ...item, level: item.level + 1 } : item
        );
        
        setKatakanaList(updatedList);
        await AsyncStorage.setItem('katakanaList', JSON.stringify(updatedList));
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating katakana level:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn Katakana</Text>
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size={24} color="#fff" />
          ) : (
            <Ionicons name="cloud-download" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={katakanaList.filter(katakana => katakana.level < 5)} // Only show katakana that haven't reached max level
        keyExtractor={(item) => item.character}
        numColumns={5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.katakanaItem, { backgroundColor: `rgba(75, 0, 130, ${0.2 + item.level * 0.15})` }]} 
            onPress={() => handleKatakanaSelect(item)}
          >
            <Text style={styles.katakanaChar}>{item.character}</Text>
            <Text style={styles.romanji}>{item.romanji}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {loading ? (
              <ActivityIndicator size={36} color="#4B0082" />
            ) : (
              <>
                {selectedKatakana && (
                  <>
                    <View style={styles.katakanaHeaderRow}>
                      <Text style={styles.modalKatakana}>{selectedKatakana.character}</Text>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => handleSpeak(selectedKatakana.character)}
                      >
                        <Ionicons name="volume-high" size={28} color="#4B0082" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalRomanji}>{selectedKatakana.romanji}</Text>
                    
                    {katakanaDetails && (
                      <View style={styles.detailsContainer}>
                        <Text style={styles.detailHeading}>Pronunciation:</Text>
                        <Text style={styles.detailText}>{katakanaDetails.pronunciation}</Text>
                        
                        <Text style={styles.detailHeading}>Example Words:</Text>
                        {katakanaDetails.examples && katakanaDetails.examples.map((example, index) => (
                          <TouchableOpacity 
                            key={index}
                            style={styles.exampleRow}
                            onPress={() => handleSpeak(example.word, example.meaning)}
                          >
                            <Text style={styles.detailText}>
                              {example.word} - {example.meaning}
                            </Text>
                            <Ionicons name="volume-medium-outline" size={20} color="#4B0082" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    <TouchableOpacity style={styles.learnedButton} onPress={markAsLearned}>
                      <Text style={styles.learnedButtonText}>Mark as Learned</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#4B0082',
  },
  katakanaItem: {
    flex: 1,
    margin: 4,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    aspectRatio: 1,
  },
  katakanaChar: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  romanji: {
    fontSize: 10,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
  },
  modalKatakana: {
    fontSize: 70,
    marginBottom: 5,
  },
  modalRomanji: {
    fontSize: 24,
    marginBottom: 15,
    color: '#4B0082',
  },
  detailsContainer: {
    width: '100%',
    marginVertical: 10,
  },
  detailHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#4B0082',
  },
  detailText: {
    fontSize: 14,
    marginBottom: 5,
  },
  learnedButton: {
    backgroundColor: '#4B0082',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  learnedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  downloadButton: {
    backgroundColor: '#4B0082',
    padding: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  katakanaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  speakButton: {
    marginLeft: 15,
    padding: 10,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
});

export default KatakanaScreen;
