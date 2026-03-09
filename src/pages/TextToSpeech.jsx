import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';

const TextToSpeech = () => {
    const [text, setText] = useState('');
    const [voices, setVoices] = useState([]);
    const [selectedVoiceName, setSelectedVoiceName] = useState('');
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [volume, setVolume] = useState(1);

    // Custom Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Playback State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
    const [highlightIndices, setHighlightIndices] = useState({ start: 0, end: 0 });

    const sentencesRef = useRef([]);
    const utteranceRef = useRef(null);
    const dropdownRef = useRef(null);

    // Initialize Voices
    const loadVoices = useCallback(() => {
        const allVoices = window.speechSynthesis.getVoices();

        // 1. Filter English
        let filtered = allVoices.filter(v => v.lang.startsWith('en'));

        // 2. Sort/Group by Provider (Microsoft first, then Google, then others)
        filtered.sort((a, b) => {
            const getRank = (name) => {
                if (name.includes('Microsoft')) return 1;
                if (name.includes('Google')) return 2;
                return 3;
            };
            return getRank(a.name) - getRank(b.name);
        });

        // 3. Limit to 15
        const finalSelection = filtered.slice(0, 15);
        setVoices(finalSelection);

        if (finalSelection.length > 0 && !selectedVoiceName) {
            setSelectedVoiceName(finalSelection[0].name);
        }
    }, [selectedVoiceName]);

    useEffect(() => {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, [loadVoices]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredVoices = useMemo(() => {
        return voices.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [voices, searchQuery]);

    const activeVoice = voices.find(v => v.name === selectedVoiceName);

    const cleanText = (rawText) => {
        if (!rawText) return [];
        let cleaned = rawText
            .replace(/[^\w\s.,!?;:()'"-]/gi, '')
            .replace(/([.!?;:])\1+/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();

        const abbreviations = {
            'AI': 'Artificial Intelligence', 'Dr.': 'Doctor', 'Mr.': 'Mister', 'Mrs.': 'Missus',
            'Ms.': 'Miss', 'etc.': 'et cetera', 'vs.': 'versus', 'USA': 'United States of America', 'UK': 'United Kingdom'
        };

        Object.entries(abbreviations).forEach(([abbr, full]) => {
            const regex = new RegExp(`\\b${abbr.replace('.', '\\.')}\\b`, 'gi');
            cleaned = cleaned.replace(regex, full);
        });
        return cleaned.split(/(?<=[.!?])\s+/).filter(s => s.length > 0);
    };

    const speakSentence = (index, textArray) => {
        if (index >= textArray.length) {
            setIsSpeaking(false);
            setCurrentSentenceIndex(-1);
            setHighlightIndices({ start: 0, end: 0 });
            return;
        }

        setCurrentSentenceIndex(index);
        const utterance = new SpeechSynthesisUtterance(textArray[index]);
        if (activeVoice) utterance.voice = activeVoice;
        utterance.rate = rate; utterance.pitch = pitch; utterance.volume = volume;

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                setHighlightIndices({ start: event.charIndex, end: event.charIndex + event.charLength });
            }
        };

        utterance.onend = () => {
            if (isSpeaking && !isPaused) {
                setTimeout(() => speakSentence(index + 1, textArray), 400);
            }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleSpeak = useCallback(() => {
        if (!text.trim()) return;
        window.speechSynthesis.cancel();
        const sentences = cleanText(text);
        sentencesRef.current = sentences;
        setIsSpeaking(true); setIsPaused(false);
        speakSentence(0, sentences);
    }, [text, activeVoice, rate, pitch, volume]);

    const handleTestVoice = () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("This is a voice sample. How do I sound?");
        if (activeVoice) utterance.voice = activeVoice;
        utterance.rate = rate; utterance.pitch = pitch; utterance.volume = volume;
        window.speechSynthesis.speak(utterance);
    };

    const handlePause = () => { window.speechSynthesis.pause(); setIsPaused(true); };
    const handleResume = () => { window.speechSynthesis.resume(); setIsPaused(false); };
    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false); setIsPaused(false);
        setCurrentSentenceIndex(-1); setHighlightIndices({ start: 0, end: 0 });
    };

    return (
        <Layout>
            <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#1e293b', paddingTop: '4rem' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
                    <header style={{ marginBottom: '4rem' }}>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                            Neural <span style={{ color: '#9333ea' }}>Narrator</span>
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.25rem', fontWeight: '500' }}>
                            Premium accessibility engine with refined voice synthesis.
                        </p>
                    </header>

                    <div className="grid" style={{ gridTemplateColumns: '1fr 400px', gap: '3rem', alignItems: 'start' }}>
                        {/* Main Editor Section */}
                        <div style={{ backgroundColor: '#f8fafc', padding: '2.5rem', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                                    TEXT CONTENT
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type or paste text here..."
                                    style={{
                                        width: '100%', height: '400px', background: '#ffffff', border: '1px solid #e2e8f0',
                                        borderRadius: '20px', padding: '2rem', fontSize: '1.2rem', lineHeight: '1.8',
                                        color: '#334155', resize: 'none', outline: 'none', transition: 'box-shadow 0.2s'
                                    }}
                                />
                            </div>

                            {isSpeaking && (
                                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '2rem', borderRadius: '24px', marginBottom: '2.5rem' }}>
                                    <div style={{ fontSize: '1.5rem', lineHeight: '1.7', fontWeight: '500', color: '#4c1d95' }}>
                                        {sentencesRef.current[currentSentenceIndex]?.split('').map((char, i) => (
                                            <span key={i} style={{
                                                backgroundColor: i >= highlightIndices.start && i < highlightIndices.end ? '#9333ea' : 'transparent',
                                                color: i >= highlightIndices.start && i < highlightIndices.end ? '#ffffff' : 'inherit',
                                                borderRadius: '4px', padding: '0 1px'
                                            }}>
                                                {char}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {!isSpeaking ? (
                                    <button onClick={handleSpeak} className="btn" style={{ flex: 1, backgroundColor: '#9333ea', color: '#fff', padding: '1.5rem', fontSize: '1.2rem', borderRadius: '100px', fontWeight: '700' }}>
                                        🔊 Read Aloud
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={isPaused ? handleResume : handlePause} className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', padding: '1.2rem', borderRadius: '100px', fontWeight: '700' }}>
                                            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                                        </button>
                                        <button onClick={handleStop} className="btn" style={{ flex: 1, backgroundColor: '#fee2e2', color: '#ef4444', padding: '1.2rem', borderRadius: '100px', fontWeight: '700' }}>
                                            ⏹️ Stop
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Controls Sidebar */}
                        <aside style={{ backgroundColor: '#f8fafc', padding: '2.5rem', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                                    VOICE SELECTION
                                </label>
                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        background: '#fff', border: '1px solid #e2e8f0', padding: '1rem 1.5rem', borderRadius: '16px',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{activeVoice?.name || 'Select Voice'}</span>
                                    <span style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▼</span>
                                </div>

                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                                        border: '1px solid #e2e8f0', borderRadius: '16px', marginTop: '0.5rem',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.05)', zIndex: 100, overflow: 'hidden'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Search voices..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{ width: '100%', border: 'none', borderBottom: '1px solid #f1f5f9', padding: '1rem 1.5rem', outline: 'none' }}
                                        />
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {filteredVoices.map(v => (
                                                <div
                                                    key={v.name}
                                                    onClick={() => { setSelectedVoiceName(v.name); setIsDropdownOpen(false); }}
                                                    style={{
                                                        padding: '1rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                                        backgroundColor: selectedVoiceName === v.name ? '#f5f3ff' : 'transparent',
                                                        hover: { backgroundColor: '#f8fafc' }
                                                    }}
                                                >
                                                    <span style={{ fontWeight: selectedVoiceName === v.name ? '700' : '500', color: selectedVoiceName === v.name ? '#9333ea' : 'inherit' }}>{v.name}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#f1f5f9', borderRadius: '100px', color: '#64748b', fontWeight: '800' }}>{v.lang}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button onClick={handleTestVoice} style={{ width: '100%', marginTop: '1rem', background: '#f5f3ff', color: '#9333ea', border: '1px solid #ddd6fe', padding: '0.8rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                    ⚡ Test Voice
                                </button>
                            </div>

                            {[
                                { label: 'Speed', val: rate, set: setRate, min: 0.5, max: 2 },
                                { label: 'Pitch', val: pitch, set: setPitch, min: 0.5, max: 2 },
                                { label: 'Volume', val: volume, set: setVolume, min: 0, max: 1 }
                            ].map(ctrl => (
                                <div key={ctrl.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8' }}>{ctrl.label.toUpperCase()}</label>
                                        <span style={{ fontWeight: '700', color: '#9333ea' }}>{ctrl.label === 'Volume' ? `${Math.round(ctrl.val * 100)}%` : `${ctrl.val}x`}</span>
                                    </div>
                                    <input
                                        type="range" min={ctrl.min} max={ctrl.max} step="0.1" value={ctrl.val}
                                        onChange={(e) => ctrl.set(parseFloat(e.target.value))}
                                        style={{ width: '100%', accentColor: '#9333ea' }}
                                    />
                                </div>
                            ))}

                            <div style={{ marginTop: 'auto', background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#64748b' }}>
                                💡 <strong>Accessibility Tip:</strong> Microsoft voices generally provide higher naturalness for long texts.
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TextToSpeech;
