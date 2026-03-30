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
            <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', color: 'var(--text-primary)', paddingTop: '4rem', transition: 'all 0.3s ease' }}>
                <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 1.5rem' }}>
                    <header style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                            Neural <span style={{ color: 'var(--accent-primary)' }}>Narrator</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500' }}>
                            Premium accessibility engine with refined voice synthesis.
                        </p>
                    </header>

                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
                        {/* Main Editor Section */}
                        <div style={{ flex: 1, width: '100%', backgroundColor: 'var(--bg-card)', padding: 'var(--card-padding)', borderRadius: '24px', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                                    TEXT CONTENT
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type or paste text here..."
                                    style={{
                                        width: '100%', height: '280px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)',
                                        borderRadius: '14px', padding: '1.2rem', fontSize: '1rem', lineHeight: '1.6',
                                        color: 'var(--text-primary)', resize: 'none', outline: 'none', transition: 'all 0.3s ease'
                                    }}
                                />
                            </div>

                            {isSpeaking && (
                                <div style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--accent-primary)', padding: '1.2rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {sentencesRef.current[currentSentenceIndex]?.split('').map((char, i) => (
                                            <span key={i} style={{
                                                backgroundColor: i >= highlightIndices.start && i < highlightIndices.end ? 'var(--accent-primary)' : 'transparent',
                                                color: i >= highlightIndices.start && i < highlightIndices.end ? '#ffffff' : 'inherit',
                                                borderRadius: '3px', padding: '0 1px'
                                            }}>
                                                {char}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {!isSpeaking ? (
                                    <button onClick={handleSpeak} className="btn" style={{ flex: 1, backgroundColor: 'var(--accent-primary)', color: '#fff', padding: '1rem', minHeight: '48px', fontSize: '1rem', borderRadius: '50px', fontWeight: '700' }}>
                                        🔊 Read Aloud
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={isPaused ? handleResume : handlePause} className="btn" style={{ flex: 1, backgroundColor: 'var(--bg-card-inner)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '1rem', minHeight: '48px', borderRadius: '50px', fontWeight: '700' }}>
                                            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                                        </button>
                                        <button onClick={handleStop} className="btn" style={{ flex: 1, backgroundColor: 'var(--danger)', color: '#fff', padding: '1rem', minHeight: '48px', borderRadius: '50px', fontWeight: '700' }}>
                                            ⏹️ Stop
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Controls Sidebar */}
                        <aside style={{ width: '100%', lg: '320px', backgroundColor: 'var(--bg-card)', padding: 'var(--card-padding)', borderRadius: '24px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'all 0.3s ease' }}>
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                                    VOICE SELECTION
                                </label>
                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)', padding: '0.75rem 1rem', borderRadius: '12px',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s ease'
                                    }}
                                >
                                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeVoice?.name || 'Select Voice'}</span>
                                    <span style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--text-primary)', fontSize: '0.8rem' }}>▼</span>
                                </div>

                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card-inner)',
                                        border: '1px solid var(--border-subtle)', borderRadius: '16px', marginTop: '0.5rem',
                                        boxShadow: 'var(--shadow-subtle)', zIndex: 100, overflow: 'hidden'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Search voices..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: '1rem 1.5rem', outline: 'none', background: 'transparent', color: 'var(--text-primary)' }}
                                        />
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {filteredVoices.map(v => (
                                                <div
                                                    key={v.name}
                                                    onClick={() => { setSelectedVoiceName(v.name); setIsDropdownOpen(false); }}
                                                    style={{
                                                        padding: '1rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                                        backgroundColor: selectedVoiceName === v.name ? 'var(--accent-primary)15' : 'transparent',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                >
                                                    <span style={{ fontWeight: selectedVoiceName === v.name ? '700' : '500', color: selectedVoiceName === v.name ? 'var(--accent-primary)' : 'inherit' }}>{v.name}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--bg-card)', borderRadius: '100px', color: 'var(--text-secondary)', fontWeight: '800' }}>{v.lang}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button onClick={handleTestVoice} style={{ width: '100%', marginTop: '0.75rem', background: 'var(--bg-card-inner)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', padding: '0.6rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '0.85rem' }}>
                                    ⚡ Test Voice
                                </button>
                            </div>

                            {[
                                { label: 'Speed', val: rate, set: setRate, min: 0.5, max: 2 },
                                { label: 'Pitch', val: pitch, set: setPitch, min: 0.5, max: 2 },
                                { label: 'Volume', val: volume, set: setVolume, min: 0, max: 1 }
                            ].map(ctrl => (
                                <div key={ctrl.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>{ctrl.label.toUpperCase()}</label>
                                        <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>{ctrl.label === 'Volume' ? `${Math.round(ctrl.val * 100)}%` : `${ctrl.val}x`}</span>
                                    </div>
                                    <input
                                        type="range" min={ctrl.min} max={ctrl.max} step="0.1" value={ctrl.val}
                                        onChange={(e) => ctrl.set(parseFloat(e.target.value))}
                                        style={{ width: '100%', height: '4px', accentColor: 'var(--accent-primary)' }}
                                    />
                                </div>
                            ))}

                            <div style={{ marginTop: 'auto', background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)', transition: 'all 0.3s ease' }}>
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
