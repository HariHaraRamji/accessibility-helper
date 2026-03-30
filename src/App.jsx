import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TextToSpeech from './pages/TextToSpeech';
import SpeechToText from './pages/SpeechToText';
import ObjectDetection from './pages/ObjectDetection';
import SoundDetection from './pages/SoundDetection';
import MedicationReminder from './pages/MedicationReminder';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './App.css';

function App() {
  // Step 1: Initialize theme early
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    const isDark = saved === "true";

    // Apply class to html tag before first render
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return isDark;
  });

  return (
    <div id="app-root">
      <ThemeProvider darkMode={darkMode} setDarkMode={setDarkMode}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tts" element={<TextToSpeech />} />
            <Route path="/stt" element={<SpeechToText />} />
            <Route path="/detection" element={<ObjectDetection />} />
            <Route path="/sound" element={<SoundDetection />} />
            <Route path="/medicine" element={<MedicationReminder />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;
