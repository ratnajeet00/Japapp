import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Speak Japanese text using the device's text-to-speech capabilities
 * @param {string} text - The Japanese text to speak
 * @param {Object} options - Optional configuration for speech
 */
export const speakJapanese = async (text, options = {}) => {
  try {
    // Default options
    let defaultOptions = {
      language: 'ja-JP',
      pitch: 1.0,
      rate: 0.75, // Slightly slower to help with learning
      ...options
    };
    
    // Android-specific options for Google TTS
    if (Platform.OS === 'android') {
      defaultOptions = {
        ...defaultOptions,
        // Use the default Android voice
        voice: 'ja-jp-x-jab-network', // This is the typical ID for Japanese Google TTS
      };
    }
    
    // Stop any current speech before starting new one
    await Speech.stop();
    
    // Speak the text
    Speech.speak(text, defaultOptions);
  } catch (error) {
    console.error('Error with text-to-speech:', error);
  }
};

/**
 * Check if text-to-speech is available on the device
 * Using a simple try-catch approach since the API functions vary across versions
 * @returns {Promise<boolean>} Whether TTS is available
 */
export const isSpeechAvailable = async () => {
  try {
    // Try speaking a blank space as a way to test availability
    // This is a workaround since isAvailableAsync may not exist
    await Speech.speak(' ', { volume: 0 });
    await Speech.stop();
    return true;
  } catch (error) {
    console.error('Speech not available:', error);
    return false;
  }
};

/**
 * Get available voices for speech and find Japanese voices
 * @returns {Promise<Object>} Object with all voices and Japanese voices
 */
export const getAvailableVoices = async () => {
  try {
    let allVoices = [];
    
    // Try to get voices if the function exists
    if (typeof Speech.getAvailableVoicesAsync === 'function') {
      allVoices = await Speech.getAvailableVoicesAsync();
    }
    
    // Filter for Japanese voices
    const japaneseVoices = allVoices.filter(voice => 
      voice.language && (voice.language.includes('ja') || voice.language.includes('JP'))
    );
    
    return { 
      allVoices: allVoices,
      japaneseVoices: japaneseVoices
    };
  } catch (error) {
    console.error('Error getting available voices:', error);
    return { allVoices: [], japaneseVoices: [] };
  }
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = async () => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
};

/**
 * Initialize TTS system and configure optimal voice for Japanese
 * Should be called when app starts
 */
export const initializeTTS = async () => {
  try {
    // Simple test to check if speech is available
    await Speech.speak(' ', { volume: 0 });
    await Speech.stop();
    
    console.log('TTS is available');

    // Try to get voices if the function exists
    if (typeof Speech.getAvailableVoicesAsync === 'function') {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        // Log available Japanese voices for debugging
        const japaneseVoices = voices.filter(voice => 
          voice.language && (voice.language.includes('ja') || voice.language.includes('JP'))
        );
        console.log('Available Japanese voices:', japaneseVoices);
      } catch (voiceError) {
        console.log('Could not get voices but TTS is still available');
      }
    } else {
      console.log('getAvailableVoicesAsync is not available in this Expo version');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing TTS:', error);
    return false;
  }
};
