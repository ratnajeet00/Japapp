# JapApp - Japanese Learning Application

JapApp is a comprehensive mobile application designed to help users learn Japanese, focusing on Kanji characters, Katakana writing system, and vocabulary building.

## 📱 Features

### 🈴 Kanji Learning
- Interactive kanji character study with detailed information
- Level-based progression system
- Stroke order animations and practice
- Audio pronunciation
- Example words containing each kanji

### 🗾 Katakana Learning
- Complete katakana character set
- Audio pronunciation
- Example words using katakana characters
- Progress tracking

### 📚 Vocabulary Building
- Words unlocked as you learn kanji
- Detailed explanations with readings and meanings
- Usage examples with translations
- JLPT level indicators
- Audio pronunciation

### ✍️ Practice Drawing
- Draw kanji characters on screen
- AI-powered recognition system
- Stroke analysis
- Get alternative suggestions when the drawing isn't perfect

### 🔍 Detailed Information
- Meaning, readings, and usage for kanji
- Example sentences and contexts
- JLPT level indicators
- Stroke order information

### 🎙️ Text-to-Speech
- Native Japanese pronunciation
- Speak example words and sentences
- Adjustable speed for learning

## 🛠️ Technical Features

- React Native & Expo framework
- GROQ API integration for Japanese language information
- Local progress tracking with AsyncStorage
- Responsive and intuitive UI
- Text-to-Speech integration
- Drawing recognition system

## 📦 Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/japapp.git
cd japapp
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the project root and add your GROQ API key:
```
GROQ_API_KEY=your_groq_api_key_here
```

4. Start the development server
```bash
npm start
```

## 💻 Development

### Environment Setup
- Node.js and npm
- Expo CLI
- A GROQ API key (sign up at https://console.groq.com)

### Running for Development
```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [GROQ API](https://groq.com) for Japanese language information
- [Expo](https://expo.dev) for the React Native development framework
- [React Navigation](https://reactnavigation.org/) for app navigation
- All open-source contributors whose libraries made this project possible
