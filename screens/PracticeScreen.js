import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  Animated, PanResponder, Alert, Modal, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { recognizeDrawnKanji } from '../services/kanjiRecognition';
import { speakJapanese } from '../services/textToSpeech';
import { fetchKanjiInfo } from '../services/groqApi';

const PracticeScreen = () => {
  const [points, setPoints] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [recognizedKanji, setRecognizedKanji] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kanjiDetails, setKanjiDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Create a pan responder for handling drawing gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setIsDrawing(true);
        setCurrentStroke([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        if (isDrawing) {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentStroke(prevStroke => [...prevStroke, { x: locationX, y: locationY }]);
        }
      },
      onPanResponderRelease: () => {
        if (isDrawing && currentStroke.length > 0) {
          setPoints(prevPoints => [...prevPoints, [...currentStroke]]);
          setCurrentStroke([]);
          setIsDrawing(false);
        }
      }
    })
  ).current;

  // Clear the drawing board
  const handleClear = () => {
    setPoints([]);
    setCurrentStroke([]);
    setRecognizedKanji(null);
    setShowResults(false);
  };

  // Perform kanji recognition on the drawing
  const handleRecognize = async () => {
    if (points.length === 0) {
      Alert.alert("No Drawing", "Please draw a kanji before recognizing.");
      return;
    }

    setLoading(true);
    try {
      // Flatten the points array to submit to recognition service
      const flatPoints = points.flat();
      const result = await recognizeDrawnKanji(flatPoints);
      
      setRecognizedKanji(result);
      setShowResults(true);

      // Animate the results appearance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error recognizing kanji:', error);
      Alert.alert("Recognition Error", "Failed to recognize the kanji. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle kanji selection to view details
  const handleKanjiSelect = async (kanji) => {
    setModalVisible(true);
    setLoading(true);
    
    try {
      // Fetch kanji details from GROQ API
      const details = await fetchKanjiInfo(kanji);
      setKanjiDetails(JSON.parse(details));
    } catch (error) {
      console.error('Error fetching kanji details:', error);
      Alert.alert("Error", "Failed to fetch details for this kanji.");
    } finally {
      setLoading(false);
    }
  };

  // Render the drawing canvas and current stroke
  const renderCanvas = () => {
    return (
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        {/* Render previous strokes */}
        {points.map((stroke, strokeIndex) => (
          <View key={`stroke-${strokeIndex}`}>
            {stroke.map((point, pointIndex) => {
              // Don't render a line for the first point in a stroke
              if (pointIndex === 0) return null;
              
              const prevPoint = stroke[pointIndex - 1];
              return (
                <View
                  key={`line-${strokeIndex}-${pointIndex}`}
                  style={[
                    styles.line,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y,
                      width: Math.sqrt(
                        Math.pow(point.x - prevPoint.x, 2) + 
                        Math.pow(point.y - prevPoint.y, 2)
                      ),
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            point.y - prevPoint.y, 
                            point.x - prevPoint.x
                          )}rad`
                        }
                      ]
                    }
                  ]}
                />
              );
            })}
          </View>
        ))}
        
        {/* Render current stroke */}
        {currentStroke.map((point, pointIndex) => {
          if (pointIndex === 0) return null;
          
          const prevPoint = currentStroke[pointIndex - 1];
          return (
            <View
              key={`current-line-${pointIndex}`}
              style={[
                styles.line,
                {
                  left: prevPoint.x,
                  top: prevPoint.y,
                  width: Math.sqrt(
                    Math.pow(point.x - prevPoint.x, 2) + 
                    Math.pow(point.y - prevPoint.y, 2)
                  ),
                  transform: [
                    {
                      rotate: `${Math.atan2(
                        point.y - prevPoint.y, 
                        point.x - prevPoint.x
                      )}rad`
                    }
                  ]
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice Writing</Text>
      
      {renderCanvas()}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={handleClear}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.recognizeButton]} 
          onPress={handleRecognize}
          disabled={loading || points.length === 0}
        >
          {loading ? (
            <Text style={styles.buttonText}>Recognizing...</Text>
          ) : (
            <Text style={styles.buttonText}>Recognize Kanji</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {showResults && recognizedKanji && (
        <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.resultsTitle}>Recognition Results</Text>
          
          <TouchableOpacity 
            style={styles.kanjiResultItem}
            onPress={() => handleKanjiSelect(recognizedKanji.kanji)}
          >
            <Text style={styles.recognizedKanji}>{recognizedKanji.kanji}</Text>
            <Text style={styles.confidence}>
              Confidence: {recognizedKanji.confidence}%
            </Text>
            <Ionicons name="information-circle-outline" size={24} color="#4B0082" />
          </TouchableOpacity>
          
          <Text style={styles.alternativesTitle}>Alternatives:</Text>
          <View style={styles.alternativesContainer}>
            {recognizedKanji.alternatives && recognizedKanji.alternatives.map((alt, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.alternativeItem}
                onPress={() => handleKanjiSelect(alt)}
              >
                <Text style={styles.alternativeKanji}>{alt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
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
                {kanjiDetails && (
                  <>
                    <View style={styles.kanjiHeaderRow}>
                      <Text style={styles.modalKanji}>{kanjiDetails.kanji}</Text>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => speakJapanese(kanjiDetails.kanji)}
                      >
                        <Ionicons name="volume-high" size={28} color="#4B0082" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailHeading}>Meaning:</Text>
                      <Text style={styles.detailText}>{kanjiDetails.meaning}</Text>
                      
                      <Text style={styles.detailHeading}>Onyomi:</Text>
                      <Text style={styles.detailText}>{kanjiDetails.onyomi}</Text>
                      
                      <Text style={styles.detailHeading}>Kunyomi:</Text>
                      <Text style={styles.detailText}>{kanjiDetails.kunyomi}</Text>
                      
                      <Text style={styles.detailHeading}>JLPT Level:</Text>
                      <Text style={styles.detailText}>{kanjiDetails.jlpt_level}</Text>
                    </View>
                    
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
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#4B0082',
  },
  canvasContainer: {
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
    marginVertical: 20,
  },
  line: {
    height: 3,
    backgroundColor: '#000',
    position: 'absolute',
    borderRadius: 5,
    transformOrigin: 'left',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  recognizeButton: {
    backgroundColor: '#4B0082',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0082',
    textAlign: 'center',
    marginBottom: 15,
  },
  kanjiResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(75, 0, 130, 0.1)',
    borderRadius: 8,
  },
  recognizedKanji: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  confidence: {
    fontSize: 14,
    color: '#555',
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#4B0082',
  },
  alternativesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  alternativeItem: {
    padding: 8,
    margin: 5,
    backgroundColor: 'rgba(75, 0, 130, 0.05)',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  alternativeKanji: {
    fontSize: 20,
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
  kanjiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  modalKanji: {
    fontSize: 70,
    marginBottom: 5,
  },
  speakButton: {
    marginLeft: 15,
    padding: 10,
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
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
});

export default PracticeScreen;
