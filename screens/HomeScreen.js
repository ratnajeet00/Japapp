import React from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  ScrollView, Image, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Japanese Learning App</Text>
          <Text style={styles.subtitle}>Learn Kanji, Katakana, and Words</Text>
        </View>
        
        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateToScreen('Kanji')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="book" size={40} color="#4B0082" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Kanji</Text>
              <Text style={styles.cardDescription}>
                Learn essential Japanese kanji characters and their meanings
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateToScreen('Katakana')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="text" size={40} color="#4B0082" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Katakana</Text>
              <Text style={styles.cardDescription}>
                Master the katakana writing system for foreign words
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateToScreen('Words')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="chatbubbles" size={40} color="#4B0082" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Words</Text>
              <Text style={styles.cardDescription}>
                Build your vocabulary with common Japanese words
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateToScreen('Practice')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="create" size={40} color="#4B0082" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Practice</Text>
              <Text style={styles.cardDescription}>
                Practice drawing kanji and see if the app can recognize it
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateToScreen('Profile')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="person" size={40} color="#4B0082" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Profile</Text>
              <Text style={styles.cardDescription}>
                View your progress and manage app settings
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#4B0082',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardsContainer: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIconContainer: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(75, 0, 130, 0.1)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HomeScreen;
