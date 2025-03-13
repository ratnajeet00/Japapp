import React, { useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { initializeTTS } from './services/textToSpeech';

// Import screens
import HomeScreen from './screens/HomeScreen';
import KanjiScreen from './screens/KanjiScreen';
import KatakanaScreen from './screens/KatakanaScreen';
import WordsScreen from './screens/WordsScreen';
import PracticeScreen from './screens/PracticeScreen';
import ProfileScreen from './screens/ProfileScreen';

// Fix for ActivityIndicator size issue
const fixActivityIndicator = () => {
  const originalRender = ActivityIndicator.render;
  if (originalRender && !ActivityIndicator._patched) {
    ActivityIndicator.render = function(props, ref) {
      const safeProps = {...props};
      if (typeof safeProps.size === 'string') {
        safeProps.size = safeProps.size === 'large' ? 36 : 20;
      }
      return originalRender.call(this, safeProps, ref);
    };
    ActivityIndicator._patched = true;
  }
};

const Tab = createBottomTabNavigator();

export default function App() {
  // Apply the fix immediately before any component rendering
  fixActivityIndicator();
  
  // Initialize Text-To-Speech when app starts
  useEffect(() => {
    const setupTTS = async () => {
      try {
        const ttsAvailable = await initializeTTS();
        console.log('Text-to-speech initialization:', ttsAvailable ? 'successful' : 'failed');
      } catch (error) {
        console.log('Text-to-speech initialization error caught:', error.message);
      }
    };
    
    setupTTS();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer
        fallback={<SafeActivityIndicator size={36} color="#4B0082" />}
      >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Kanji') {
                iconName = focused ? 'book' : 'book-outline';
              } else if (route.name === 'Katakana') {
                iconName = focused ? 'text' : 'text-outline';
              } else if (route.name === 'Words') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Practice') {
                iconName = focused ? 'create' : 'create-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4B0082',
            tabBarInactiveTintColor: 'gray',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#4B0082',
            },
            headerTintColor: '#fff',
          })}
          initialRouteName="Home"
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Kanji" component={KanjiScreen} />
          <Tab.Screen name="Katakana" component={KatakanaScreen} />
          <Tab.Screen name="Words" component={WordsScreen} />
          <Tab.Screen name="Practice" component={PracticeScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

// Safe Activity Indicator wrapper
const SafeActivityIndicator = (props) => {
  const size = typeof props.size === 'string' 
    ? (props.size === 'large' ? 36 : 20) 
    : props.size || 24;
  
  return <ActivityIndicator {...props} size={size} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
