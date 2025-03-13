import axios from 'axios';
import { GROQ_API_KEY } from '@env';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const groqClient = axios.create({
  baseURL: GROQ_API_URL,
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export const fetchKanjiInfo = async (kanji) => {
  try {
    const response = await groqClient.post('', {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a Japanese language teacher assistant. Provide detailed information about kanji characters.'
        },
        {
          role: 'user',
          content: `Provide the following information about the kanji "${kanji}": 
          1. Meaning 
          2. Onyomi reading 
          3. Kunyomi reading 
          4. Stroke order description 
          5. Example words using this kanji with their meanings 
          6. JLPT level
          Format as JSON.`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error fetching kanji information:', error);
    throw error;
  }
};

export const fetchKatakanaInfo = async (katakana) => {
  try {
    const response = await groqClient.post('', {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a Japanese language teacher assistant. Provide detailed information about katakana characters.'
        },
        {
          role: 'user',
          content: `Provide the following information about the katakana "${katakana}": 
          1. Pronunciation 
          2. Example words using this katakana with their meanings
          Format as JSON.`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error fetching katakana information:', error);
    throw error;
  }
};

export const fetchWordInfo = async (word) => {
  try {
    const response = await groqClient.post('', {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a Japanese language teacher assistant. Provide detailed information about Japanese words and phrases.'
        },
        {
          role: 'user',
          content: `Provide the following information about the Japanese word/phrase "${word}": 
          1. Meaning 
          2. Reading (Hiragana/Katakana) 
          3. Usage examples with translations
          4. JLPT level (if applicable)
          Format as JSON.`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error fetching word information:', error);
    throw error;
  }
};

export const getStrokeAnimation = async (kanji) => {
  try {
    const response = await groqClient.post('', {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a Japanese language teacher assistant. Provide detailed stroke order instructions for kanji characters.'
        },
        {
          role: 'user',
          content: `Generate detailed SVG path data for animating stroke order of the kanji "${kanji}" in JSON format.`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error fetching stroke animation data:', error);
    throw error;
  }
};

// New function to download Kanji data from an external API
export const downloadKanjiData = async () => {
  try {
    // Using a public Japanese language API for demonstration
    // In production, use a reliable API with proper licensing
    const response = await axios.get('https://kanjiapi.dev/v1/kanji/grade-1');
    
    // Transform the data to match our app's format
    const kanjiData = response.data.map(kanji => {
      return {
        kanji: kanji,
        meaning: '', // Will be populated by fetchKanjiInfo when viewed
        level: 0
      };
    });
    
    return kanjiData;
  } catch (error) {
    console.error('Error downloading kanji data:', error);
    throw error;
  }
};

// Function to download Katakana data
export const downloadKatakanaData = async () => {
  try {
    // Using a simplified approach since Katakana is a fixed set
    // In production, fetch this from a reliable API
    const response = await axios.get('https://api.nihongoresources.com/kana/katakana');
    
    // Transform the data to match our app's format
    const katakanaData = response.data.map(katakana => {
      return {
        character: katakana.kana,
        romanji: katakana.romaji,
        level: 0
      };
    });
    
    return katakanaData;
  } catch (error) {
    console.error('Error downloading katakana data:', error);
    
    // Fallback to basic katakana if API fails
    const basicKatakana = [
      { character: 'ア', romanji: 'a', level: 0 },
      { character: 'イ', romanji: 'i', level: 0 },
      // ...existing katakana list...
      { character: 'ン', romanji: 'n', level: 0 }
    ];
    return basicKatakana;
  }
};

// Function to get words containing specific kanji
export const getWordsForKanji = async (kanji) => {
  try {
    const response = await groqClient.post('', {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a Japanese language teacher assistant. Provide words containing specific kanji.'
        },
        {
          role: 'user',
          content: `Generate 5 common Japanese words that contain the kanji "${kanji}". 
          Include the following for each word:
          1. Word in Japanese
          2. Reading in hiragana
          3. English meaning
          4. JLPT level (N5-N1)
          Format as JSON array.`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error fetching words for kanji:', error);
    throw error;
  }
};
