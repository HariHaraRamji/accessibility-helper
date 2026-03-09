import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TextToSpeech from './pages/TextToSpeech';
import SpeechToText from './pages/SpeechToText';
import ObjectDetection from './pages/ObjectDetection';
import SoundDetection from './pages/SoundDetection';
import MedicationReminder from './pages/MedicationReminder';
import './App.css';

function App() {
  // Step 6: Load on startup
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("darkMode")) || false;
    } catch {
      return false;
    }
  });

  // Step 6: Persist dark mode to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <div className={darkMode ? "app dark-mode" : "app"}>
      <ThemeProvider darkMode={darkMode} setDarkMode={setDarkMode}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tts" element={<TextToSpeech />} />
            <Route path="/stt" element={<SpeechToText />} />
            <Route path="/detection" element={<ObjectDetection />} />
            <Route path="/sound" element={<SoundDetection />} />
            <Route path="/medicine" element={<MedicationReminder />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;
