import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  Modal, ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { 
  fetchKanjiInfo, getStrokeAnimation, 
  downloadKanjiData, getWordsForKanji 
} from '../services/groqApi';
import { speakJapanese, stopSpeaking } from '../services/textToSpeech';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Basic JLPT N5 Kanji list
const initialKanjiList = [
  { kanji: '一', meaning: 'one', level: 0 },
  { kanji: '二', meaning: 'two', level: 0 },
  { kanji: '三', meaning: 'three', level: 0 },
  { kanji: '四', meaning: 'four', level: 0 },
  { kanji: '五', meaning: 'five', level: 0 },
  { kanji: '六', meaning: 'six', level: 0 },
  // Add more initial kanji here
];

const KanjiScreen = ({ navigation }) => {
  const [kanjiList, setKanjiList] = useState([]);
  const [selectedKanji, setSelectedKanji] = useState(null);
  const [kanjiDetails, setKanjiDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [strokeData, setStrokeData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [relatedWords, setRelatedWords] = useState([]);
  
  // Load kanji and check if words need to be unlocked
  useEffect(() => {
    loadKanjiData();
    checkWordUnlocks();
  }, []);

  // Load kanji list and progress from AsyncStorage
  const loadKanjiData = async () => {
    try {
      const storedKanji = await AsyncStorage.getItem('kanjiList');
      if (storedKanji !== null) {
        setKanjiList(JSON.parse(storedKanji));
      } else {
        setKanjiList(initialKanjiList);
        await AsyncStorage.setItem('kanjiList', JSON.stringify(initialKanjiList));
      }
    } catch (error) {
      console.error('Error loading kanji data:', error);
      setKanjiList(initialKanjiList);
    }
  };

  // Check if we should unlock any words based on completed kanji
  const checkWordUnlocks = async () => {
    try {
      const storedKanji = await AsyncStorage.getItem('kanjiList');
      if (storedKanji !== null) {
        const kanjiData = JSON.parse(storedKanji);
        
        // Find all level 1+ kanji (completed at least once)
        const completedKanji = kanjiData.filter(k => k.level > 0);
        
        if (completedKanji.length > 0) {
          // Get current word list
          const storedWords = await AsyncStorage.getItem('wordsList');
          let wordsList = storedWords ? JSON.parse(storedWords) : [];
          
          // For each completed kanji, check if we need to fetch related words
          for (const kanji of completedKanji) {
            // Check if we already have words for this kanji
            const hasWords = wordsList.some(word => word.sourceKanji === kanji.kanji);
            
            if (!hasWords) {
              // Fetch words containing this kanji
              const wordsData = await getWordsForKanji(kanji.kanji);
              const wordsJson = JSON.parse(wordsData);
              
              // Add source kanji information and starting level
              const formattedWords = wordsJson.words.map(word => ({
                ...word,
                sourceKanji: kanji.kanji,
                level: 0
              }));
              
              // Add these words to our list
              wordsList = [...wordsList, ...formattedWords];
            }
          }
          
          // Save updated word list
          await AsyncStorage.setItem('wordsList', JSON.stringify(wordsList));
        }
      }
    } catch (error) {
      console.error('Error checking word unlocks:', error);
    }
  };

  const handleKanjiSelect = async (kanji) => {
    setSelectedKanji(kanji);
    setModalVisible(true);
    setLoading(true);
    setRelatedWords([]);
    
    try {
      // Fetch kanji details from GROQ API
      const details = await fetchKanjiInfo(kanji.kanji);
      const parsedDetails = JSON.parse(details);
      setKanjiDetails(parsedDetails);
      
      // Fetch stroke animation data
      const animation = await getStrokeAnimation(kanji.kanji);
      setStrokeData(JSON.parse(animation));
      
      // Get related words if kanji is level 1+
      if (kanji.level > 0) {
        try {
          const storedWords = await AsyncStorage.getItem('wordsList');
          if (storedWords) {
            const wordsList = JSON.parse(storedWords);
            const kanjiWords = wordsList.filter(word => 
              word.sourceKanji === kanji.kanji || word.word.includes(kanji.kanji)
            );
            setRelatedWords(kanjiWords);
          }
        } catch (err) {
          console.error('Error loading related words:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching kanji details:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsLearned = async () => {
    try {
      if (selectedKanji) {
        // Update kanji level
        const updatedList = kanjiList.map((item) => 
          item.kanji === selectedKanji.kanji ? { ...item, level: item.level + 1 } : item
        );
        
        setKanjiList(updatedList);
        await AsyncStorage.setItem('kanjiList', JSON.stringify(updatedList));
        
        // If this kanji is now level 1, trigger word unlocks
        if (selectedKanji.level === 0) {
          try {
            // Get words for this kanji
            const wordsData = await getWordsForKanji(selectedKanji.kanji);
            const wordsJson = JSON.parse(wordsData);
            
            // Get current word list
            const storedWords = await AsyncStorage.getItem('wordsList');
            let wordsList = storedWords ? JSON.parse(storedWords) : [];
            
            // Add source kanji information and starting level
            const formattedWords = wordsJson.words.map(word => ({
              ...word,
              sourceKanji: selectedKanji.kanji,
              level: 0
            }));
            
            // Add these words to our list
            wordsList = [...wordsList, ...formattedWords];
            
            // Save updated word list
            await AsyncStorage.setItem('wordsList', JSON.stringify(wordsList));
            
            // Inform the user about unlocked words
            Alert.alert(
              "New Words Unlocked!",
              `You've unlocked ${formattedWords.length} new words containing the kanji ${selectedKanji.kanji}`,
              [{ text: "Great!", onPress: () => setModalVisible(false) }]
            );
          } catch (error) {
            console.error('Error unlocking words:', error);
            setModalVisible(false);
          }
        } else {
          setModalVisible(false);
        }
      }
    } catch (error) {
      console.error('Error updating kanji level:', error);
      setModalVisible(false);
    }
  };

  // Pull to refresh - download new kanji data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Download fresh kanji data
      const newKanji = await downloadKanjiData();
      
      // Merge with existing kanji data (keeping progress for existing kanji)
      const storedKanji = await AsyncStorage.getItem('kanjiList');
      let existingKanji = storedKanji ? JSON.parse(storedKanji) : [];
      
      // Create a map of existing kanji for quick lookup
      const kanjiMap = {};
      existingKanji.forEach(k => {
        kanjiMap[k.kanji] = k;
      });
      
      // Merge new kanji with existing data
      const mergedKanji = newKanji.map(k => {
        return kanjiMap[k.kanji] ? kanjiMap[k.kanji] : k;
      });
      
      // Save and update state
      await AsyncStorage.setItem('kanjiList', JSON.stringify(mergedKanji));
      setKanjiList(mergedKanji);
      
      Alert.alert("Success", "Kanji data updated successfully!");
    } catch (error) {
      console.error('Error refreshing kanji data:', error);
      Alert.alert("Error", "Failed to update kanji data. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle downloading all kanji data
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const newKanji = await downloadKanjiData();
      
      // Merge with existing kanji data (keeping progress for existing kanji)
      const storedKanji = await AsyncStorage.getItem('kanjiList');
      let existingKanji = storedKanji ? JSON.parse(storedKanji) : [];
      
      // Create a map of existing kanji for quick lookup
      const kanjiMap = {};
      existingKanji.forEach(k => {
        kanjiMap[k.kanji] = k;
      });
      
      // Merge new kanji with existing data
      const mergedKanji = newKanji.map(k => {
        return kanjiMap[k.kanji] ? kanjiMap[k.kanji] : k;
      });
      
      // Save and update state
      await AsyncStorage.setItem('kanjiList', JSON.stringify(mergedKanji));
      setKanjiList(mergedKanji);
      
      Alert.alert("Success", "Kanji data downloaded successfully!");
    } catch (error) {
      console.error('Error downloading kanji data:', error);
      Alert.alert("Error", "Failed to download kanji data. Please check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Speak the kanji using TTS
  const handleSpeak = (text, meaning) => {
    speakJapanese(text);
    // After speaking the Japanese, speak the English meaning with a pause
    setTimeout(() => {
      speakJapanese(meaning, { language: 'en-US' });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn Kanji</Text>
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
        data={kanjiList.filter(kanji => kanji.level < 5)}
        keyExtractor={(item) => item.kanji}
        numColumns={3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.kanjiItem, { backgroundColor: `rgba(75, 0, 130, ${0.2 + item.level * 0.15})` }]} 
            onPress={() => handleKanjiSelect(item)}
          >
            <Text style={styles.kanjiChar}>{item.kanji}</Text>
            <Text style={styles.kanjiLevel}>Level {item.level}</Text>
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
                {selectedKanji && (
                  <>
                    <View style={styles.karjiHeaderRow}>
                      <Text style={styles.modalKanji}>{selectedKanji.kanji}</Text>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => handleSpeak(selectedKanji.kanji, kanjiDetails?.meaning || selectedKanji.meaning)}
                      >
                        <Ionicons name="volume-high" size={28} color="#4B0082" />
                      </TouchableOpacity>
                    </View>
                    
                    {kanjiDetails && (
                      <View style={styles.detailsContainer}>
                        <Text style={styles.detailHeading}>Meaning:</Text>
                        <Text style={styles.detailText}>{kanjiDetails.meaning}</Text>
                        
                        <Text style={styles.detailHeading}>Onyomi:</Text>
                        <Text style={styles.detailText}>{kanjiDetails.onyomi}</Text>
                        
                        <Text style={styles.detailHeading}>Kunyomi:</Text>
                        <Text style={styles.detailText}>{kanjiDetails.kunyomi}</Text>
                        
                        <Text style={styles.detailHeading}>Example Words:</Text>
                        {kanjiDetails.examples && kanjiDetails.examples.map((example, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.exampleRow}
                            onPress={() => handleSpeak(example.word, example.meaning)}
                          >
                            <Text style={styles.detailText}>
                              {example.word} ({example.reading}) - {example.meaning}
                            </Text>
                            <Ionicons name="volume-medium-outline" size={20} color="#4B0082" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    {strokeData && strokeData.paths && (
                      <View style={styles.strokeContainer}>
                        <Text style={styles.detailHeading}>Stroke Order:</Text>
                        <Svg height="200" width="200" viewBox="0 0 109 109">
                          {strokeData.paths.map((pathData, index) => (
                            <Path
                              key={index}
                              d={pathData}
                              fill="none"
                              stroke="#000"
                              strokeWidth="3"
                            />
                          ))}
                        </Svg>
                      </View>
                    )}
                    
                    {relatedWords.length > 0 && (
                      <View style={styles.relatedWordsContainer}>
                        <Text style={styles.detailHeading}>Unlocked Words:</Text>
                        {relatedWords.map((word, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.wordItem}
                            onPress={() => handleSpeak(word.word, word.meaning)}
                          >
                            <Text style={styles.wordText}>
                              {word.word} ({word.reading}) - {word.meaning}
                            </Text>
                            <Ionicons name="volume-medium-outline" size={20} color="#4B0082" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    <TouchableOpacity style={styles.learnedButton} onPress={markAsLearned}>
                      <Text style={styles.learnedButtonText}>
                        {selectedKanji.level === 0 
                          ? "Mark as Learned (Unlock Words)" 
                          : "Level Up"
                        }
                      </Text>
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
  kanjiItem: {
    flex: 1,
    margin: 5,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    aspectRatio: 1,
  },
  kanjiChar: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
  },
  kanjiLevel: {
    fontSize: 12,
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
  modalKanji: {
    fontSize: 70,
    marginBottom: 15,
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
  strokeContainer: {
    marginVertical: 10,
    alignItems: 'center',
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
  karjiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
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
  relatedWordsContainer: {
    width: '100%',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  wordText: {
    fontSize: 14,
    flex: 1,
  },
});

export default KanjiScreen;
