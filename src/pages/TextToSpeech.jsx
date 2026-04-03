import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import FeatureGuide from '../components/FeatureGuide';

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
    const isActiveRef = useRef(false);

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

    // Stop speech on unmount (page navigation)
    useEffect(() => {
        return () => {
            isActiveRef.current = false;
            window.speechSynthesis.cancel();
        };
    }, []);

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
            isActiveRef.current = false;
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
            if (isActiveRef.current) {
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
        isActiveRef.current = true;
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
        isActiveRef.current = false;
        window.speechSynthesis.cancel();
        setIsSpeaking(false); setIsPaused(false);
        setCurrentSentenceIndex(-1); setHighlightIndices({ start: 0, end: 0 });
    };

    // --- Styles ---
    const pageStyle = {
        backgroundColor: 'var(--bg-page)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        paddingTop: '3rem',
        paddingBottom: '4rem',
        transition: 'all 0.3s ease',
    };

    const containerStyle = {
        maxWidth: '768px',
        margin: '0 auto',
        padding: '0 1.5rem',
    };

    const headerStyle = {
        marginBottom: '2.5rem',
        textAlign: 'center',
    };

    const textareaWrapperStyle = {
        position: 'relative',
        marginBottom: '2.5rem',
    };

    const textareaStyle = {
        width: '100%',
        minHeight: '320px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '2rem',
        padding: '1.5rem 1.5rem 5rem 1.5rem',
        fontSize: '1.1rem',
        lineHeight: '1.75',
        color: 'var(--text-primary)',
        resize: 'none',
        outline: 'none',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        position: 'relative',
        zIndex: 1,
    };

    const floatingControlsStyle = {
        position: 'absolute',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '999px',
        padding: '0.5rem 0.75rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid var(--border-subtle)',
        zIndex: 10,
    };

    const controlBtnBase = {
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
    };

    const smallBtnStyle = {
        ...controlBtnBase,
        width: '44px',
        height: '44px',
        background: 'var(--bg-card-inner)',
        color: 'var(--text-secondary)',
        fontSize: '1.1rem',
    };

    const playBtnStyle = {
        ...controlBtnBase,
        width: '56px',
        height: '56px',
        background: 'var(--accent-gradient)',
        color: '#ffffff',
        fontSize: '1.4rem',
        boxShadow: '0 4px 16px rgba(30,58,138,0.3)',
    };

    const sectionHeadingStyle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '1.25rem',
    };

    const settingsCardStyle = {
        background: 'var(--bg-card)',
        borderRadius: '1.5rem',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1rem',
        transition: 'all 0.3s ease',
    };

    const sliderTrackStyle = {
        width: '100%',
        height: '4px',
        accentColor: 'var(--accent-primary)',
        marginTop: '0.75rem',
    };

    const sliderEndLabelStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.4rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        fontWeight: '500',
    };



    // Highlight reader
    const highlightBlock = isSpeaking && (
        <div style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--accent-primary)',
            padding: '1.25rem 1.5rem',
            borderRadius: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 0 24px rgba(30,58,138,0.08)',
        }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '6px' }}>graphic_eq</span>
                Now Reading
            </div>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.7', fontWeight: '500', color: 'var(--text-primary)' }}>
                {sentencesRef.current[currentSentenceIndex]?.split('').map((char, i) => (
                    <span key={i} style={{
                        backgroundColor: i >= highlightIndices.start && i < highlightIndices.end ? 'var(--accent-primary)' : 'transparent',
                        color: i >= highlightIndices.start && i < highlightIndices.end ? '#ffffff' : 'inherit',
                        borderRadius: '3px',
                        padding: '1px 2px',
                        transition: 'background-color 0.15s ease',
                    }}>
                        {char}
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <Layout>
            <div style={pageStyle}>
                <div style={containerStyle}>
                    {/* Header */}
                    <header style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                                Neural <span style={{ color: 'var(--accent-primary)' }}>Narrator</span>
                            </h1>
                            <FeatureGuide
                                title="Neural Narrator"
                                steps={[
                                    { title: 'Enter Your Text', description: 'Type or paste any text into the large text area. The narrator supports long passages and will read sentence by sentence.' },
                                    { title: 'Choose a Voice', description: 'Open the Voice Selection card below. Search and pick from available English voices including Microsoft and Google voices.' },
                                    { title: 'Adjust Settings', description: 'Fine-tune Reading Speed, Voice Pitch, and Master Volume using the sliders to match your preferred listening experience.' },
                                    { title: 'Play & Control', description: 'Use the floating controls at the bottom of the text area: Play ▶ to start, Pause ⏸ to pause, Stop ⏹ to end. The current sentence is highlighted live.' },
                                    { title: 'Test Voice', description: 'Press "Test Voice" in the voice card to hear a short sample before committing to a full read-through.' },
                                ]}
                            />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500' }}>
                            Premium accessibility engine with refined voice synthesis.
                        </p>
                    </header>

                    {/* Text Input with Floating Controls */}
                    <div style={textareaWrapperStyle}>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type or paste your text here to begin reading..."
                            style={textareaStyle}
                        />
                        <div style={floatingControlsStyle}>
                            {/* Stop */}
                            <button
                                onClick={handleStop}
                                style={smallBtnStyle}
                                title="Stop"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>stop</span>
                            </button>
                            {/* Play / Resume */}
                            <button
                                onClick={isSpeaking ? (isPaused ? handleResume : handleSpeak) : handleSpeak}
                                style={playBtnStyle}
                                title={isSpeaking && !isPaused ? 'Playing' : 'Play'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                                    {isSpeaking && !isPaused ? 'play_arrow' : 'play_arrow'}
                                </span>
                            </button>
                            {/* Pause */}
                            <button
                                onClick={isSpeaking ? handlePause : undefined}
                                style={{
                                    ...smallBtnStyle,
                                    opacity: isSpeaking ? 1 : 0.4,
                                    cursor: isSpeaking ? 'pointer' : 'default',
                                }}
                                title="Pause"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>pause</span>
                            </button>
                        </div>
                    </div>

                    {/* Highlight Reader */}
                    {highlightBlock}

                    {/* Voice Settings */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={sectionHeadingStyle}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-primary)' }}>tune</span>
                            Voice Settings
                        </h2>

                        {/* Voice Selection Card */}
                        <div style={settingsCardStyle} ref={dropdownRef}>
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                            >
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: 'var(--accent-subtle)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '22px' }}>record_voice_over</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '2px', textTransform: 'uppercase' }}>Voice Selection</div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {activeVoice?.name || 'Select a Voice'}
                                    </div>
                                    {activeVoice && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            Language: {activeVoice.lang}
                                        </div>
                                    )}
                                </div>
                                <span className="material-symbols-outlined" style={{
                                    color: 'var(--text-muted)',
                                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s ease',
                                    fontSize: '24px',
                                }}>expand_more</span>
                            </div>

                            {isDropdownOpen && (
                                <div style={{
                                    marginTop: '1rem',
                                    background: 'var(--bg-card-inner)',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--border-subtle)',
                                    overflow: 'hidden',
                                }}>
                                    <input
                                        type="text"
                                        placeholder="Search voices..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            border: 'none',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            padding: '0.85rem 1.25rem',
                                            outline: 'none',
                                            background: 'transparent',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                    <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                        {filteredVoices.map(v => (
                                            <div
                                                key={v.name}
                                                onClick={() => { setSelectedVoiceName(v.name); setIsDropdownOpen(false); }}
                                                style={{
                                                    padding: '0.75rem 1.25rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    backgroundColor: selectedVoiceName === v.name ? 'var(--accent-subtle)' : 'transparent',
                                                    transition: 'background-color 0.15s ease',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = selectedVoiceName === v.name ? 'var(--accent-glow)' : 'rgba(0,0,0,0.03)'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedVoiceName === v.name ? 'var(--accent-subtle)' : 'transparent'}
                                            >
                                                <span style={{
                                                    fontWeight: selectedVoiceName === v.name ? '700' : '500',
                                                    color: selectedVoiceName === v.name ? 'var(--accent-primary)' : 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                }}>
                                                    {v.name}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '3px 10px',
                                                    background: 'var(--bg-page)',
                                                    borderRadius: '999px',
                                                    color: 'var(--text-secondary)',
                                                    fontWeight: '700',
                                                }}>
                                                    {v.lang}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleTestVoice}
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    background: 'transparent',
                                    color: 'var(--accent-primary)',
                                    border: '1.5px solid var(--accent-primary)',
                                    padding: '0.65rem',
                                    borderRadius: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>volume_up</span>
                                Test Voice
                            </button>
                        </div>

                        {/* Speed Slider Card */}
                        <div style={settingsCardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--accent-primary)' }}>speed</span>
                                    <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Reading Speed</span>
                                </div>
                                <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '0.9rem', background: 'var(--accent-subtle)', padding: '4px 12px', borderRadius: '999px' }}>
                                    {rate}x
                                </span>
                            </div>
                            <input
                                type="range" min={0.5} max={2} step={0.1} value={rate}
                                onChange={(e) => setRate(parseFloat(e.target.value))}
                                style={sliderTrackStyle}
                            />
                            <div style={sliderEndLabelStyle}>
                                <span>Slower</span>
                                <span>Faster</span>
                            </div>
                        </div>

                        {/* Pitch Slider Card */}
                        <div style={settingsCardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--accent-primary)' }}>height</span>
                                    <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Voice Pitch</span>
                                </div>
                                <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '0.9rem', background: 'var(--accent-subtle)', padding: '4px 12px', borderRadius: '999px' }}>
                                    {pitch}x
                                </span>
                            </div>
                            <input
                                type="range" min={0.5} max={2} step={0.1} value={pitch}
                                onChange={(e) => setPitch(parseFloat(e.target.value))}
                                style={sliderTrackStyle}
                            />
                            <div style={sliderEndLabelStyle}>
                                <span>Deep</span>
                                <span>High</span>
                            </div>
                        </div>

                        {/* Volume Slider Card (Full Width) */}
                        <div style={settingsCardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--accent-primary)' }}>volume_up</span>
                                    <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Master Volume</span>
                                </div>
                                <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '0.9rem', background: 'var(--accent-subtle)', padding: '4px 12px', borderRadius: '999px' }}>
                                    {Math.round(volume * 100)}%
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)', flexShrink: 0 }}>volume_mute</span>
                                <input
                                    type="range" min={0} max={1} step={0.1} value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    style={{ ...sliderTrackStyle, marginTop: 0, flex: 1 }}
                                />
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)', flexShrink: 0 }}>volume_up</span>
                            </div>
                        </div>
                    </section>


                </div>
            </div>
        </Layout>
    );
};

export default TextToSpeech;
