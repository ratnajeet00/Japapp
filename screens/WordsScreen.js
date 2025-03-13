import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  Modal, ActivityIndicator, Alert 
} from 'react-native';
import { fetchWordInfo } from '../services/groqApi';
import { speakJapanese } from '../services/textToSpeech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const WordsScreen = () => {
  const [wordsList, setWordsList] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordDetails, setWordDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Load words list from AsyncStorage
  useEffect(() => {
    const loadWords = async () => {
      try {
        const storedWords = await AsyncStorage.getItem('wordsList');
        if (storedWords) {
          setWordsList(JSON.parse(storedWords));
        }
      } catch (error) {
        console.error('Error loading words data:', error);
      }
    };
    
    loadWords();
  }, []);

  const handleWordSelect = async (word) => {
    setSelectedWord(word);
    setModalVisible(true);
    setLoading(true);
    
    try {
      // Fetch word details from GROQ API
      const details = await fetchWordInfo(word.word);
      setWordDetails(JSON.parse(details));
    } catch (error) {
      console.error('Error fetching word details:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsLearned = async () => {
    try {
      if (selectedWord) {
        // Update word level
        const updatedList = wordsList.map((item) => 
          item.word === selectedWord.word ? { ...item, level: item.level + 1 } : item
        );
        
        setWordsList(updatedList);
        await AsyncStorage.setItem('wordsList', JSON.stringify(updatedList));
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating word level:', error);
    }
  };

  // Speak the word using TTS
  const handleSpeak = (text, meaning = '') => {
    speakJapanese(text);
    if (meaning) {
      // After speaking the Japanese, speak the English meaning with a pause
      setTimeout(() => {
        speakJapanese(meaning, { language: 'en-US' });
      }, 1500);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Learn Words</Text>
      
      {wordsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No words available yet.</Text>
          <Text style={styles.emptySubtext}>Complete Kanji lessons to unlock words!</Text>
        </View>
      ) : (
        <FlatList
          data={wordsList.filter(word => word.level < 5)}
          keyExtractor={(item, index) => `${item.word}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.wordItem, { backgroundColor: `rgba(75, 0, 130, ${0.2 + item.level * 0.15})` }]} 
              onPress={() => handleWordSelect(item)}
            >
              <View style={styles.wordContent}>
                <Text style={styles.wordText}>{item.word}</Text>
                <Text style={styles.readingText}>{item.reading}</Text>
              </View>
              <View style={styles.meaningContainer}>
                <Text style={styles.meaningText}>{item.meaning}</Text>
                <Text style={styles.levelText}>Level {item.level}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

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
                {selectedWord && (
                  <>
                    <View style={styles.wordHeaderRow}>
                      <Text style={styles.modalWord}>{selectedWord.word}</Text>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => handleSpeak(selectedWord.word, selectedWord.meaning)}
                      >
                        <Ionicons name="volume-high" size={28} color="#4B0082" />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.modalReading}>{selectedWord.reading}</Text>
                    <Text style={styles.modalMeaning}>{selectedWord.meaning}</Text>
                    
                    {wordDetails && (
                      <View style={styles.detailsContainer}>
                        <Text style={styles.detailHeading}>JLPT Level:</Text>
                        <Text style={styles.detailText}>{wordDetails.jlpt_level || "Unknown"}</Text>
                        
                        <Text style={styles.detailHeading}>Usage Examples:</Text>
                        {wordDetails.examples && wordDetails.examples.map((example, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.exampleRow}
                            onPress={() => handleSpeak(example.japanese, example.english)}
                          >
                            <Text style={styles.detailText}>
                              {example.japanese} - {example.english}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  wordItem: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  wordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  readingText: {
    fontSize: 14,
    color: '#555',
  },
  meaningContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meaningText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  levelText: {
    fontSize: 12,
    color: '#666',
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
  wordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  modalWord: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalReading: {
    fontSize: 18,
    color: '#555',
    marginBottom: 15,
  },
  modalMeaning: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
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
});

export default WordsScreen;
