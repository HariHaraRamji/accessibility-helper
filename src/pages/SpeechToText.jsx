import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';

const SpeechToText = () => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [savedNotes, setSavedNotes] = useState([]);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [interimTranscript, setInterimTranscript] = useState('');

    const recognitionRef = useRef(null);
    const recognitionActiveRef = useRef(false);

    // Initialize Notes and SpeechRecognition
    useEffect(() => {
        // Load notes from LocalStorage
        const local = localStorage.getItem('access_helper_notes');
        if (local) setSavedNotes(JSON.parse(local));

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript;
                    } else {
                        interim += transcript;
                    }
                }

                if (final) setText(prev => prev + (prev ? ' ' : '') + final);
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please enable it in browser settings.');
                }
                setIsRecording(false);
                recognitionActiveRef.current = false;
            };

            recognition.onend = () => {
                // If we're still supposed to be recording, restart (workaround for some browser timeouts)
                if (recognitionActiveRef.current) {
                    recognition.start();
                } else {
                    setIsRecording(false);
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionActiveRef.current = false;
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isRecording) {
            recognitionActiveRef.current = false;
            recognitionRef.current.stop();
            setIsRecording(false);
            setInterimTranscript('');
        } else {
            recognitionActiveRef.current = true;
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const saveNote = () => {
        if (!text.trim()) return;

        let updatedNotes;
        if (editingNoteId) {
            updatedNotes = savedNotes.map(note =>
                note.id === editingNoteId ? { ...note, text, updatedAt: Date.now() } : note
            );
            setEditingNoteId(null);
        } else {
            const newNote = {
                id: Date.now(),
                text: text.trim(),
                createdAt: Date.now()
            };
            updatedNotes = [newNote, ...savedNotes];
        }

        setSavedNotes(updatedNotes);
        localStorage.setItem('access_helper_notes', JSON.stringify(updatedNotes));
        setText('');
        setInterimTranscript('');
    };

    const deleteNote = (id) => {
        const updated = savedNotes.filter(n => n.id !== id);
        setSavedNotes(updated);
        localStorage.setItem('access_helper_notes', JSON.stringify(updated));
    };

    const editNote = (note) => {
        setText(note.text);
        setEditingNoteId(note.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const readAloud = (noteText) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(noteText);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    const downloadAll = () => {
        if (savedNotes.length === 0) return;
        const content = savedNotes.map(n =>
            `[${new Date(n.createdAt).toLocaleString()}]\n${n.text}\n`
        ).join('\n---\n\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'accessibility_notes.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Layout>
            <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 1.5rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 1rem',
                        borderRadius: '100px',
                        background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: isRecording ? '#ef4444' : 'var(--accent-primary)',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '1rem',
                        border: `1px solid ${isRecording ? '#ef444440' : 'var(--accent-primary)40'}`,
                        boxShadow: isRecording ? '0 0 15px rgba(239, 68, 68, 0.15)' : 'none'
                    }}>
                        <span className={isRecording ? 'pulse' : ''}>
                            {isRecording ? '🔴 Recording' : '🎙️ Ready'}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }} className="text-gradient">Voice Notes</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
                        High-accuracy transcription with secure offline storage.
                    </p>
                </header>

                <div className="grid" style={{ gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
                    <div className="card" style={{ padding: 'var(--card-padding)', borderRadius: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <button
                                onClick={toggleRecording}
                                style={{
                                    width: '80px', height: '80px',
                                    borderRadius: '50%',
                                    background: isRecording
                                        ? 'linear-gradient(135deg, var(--danger), #b91c1c)'
                                        : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '2rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: 'var(--shadow-subtle)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    margin: '0 auto 0.75rem'
                                }}
                            >
                                {isRecording ? '⏹️' : '🎙️'}
                            </button>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                                {isRecording ? 'TAP TO STOP' : 'TAP TO RECORD'}
                            </label>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                TRANSCRIPT
                            </label>
                            <textarea
                                value={text + (interimTranscript ? (text ? ' ' : '') + interimTranscript : '')}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Your words will appear here..."
                                style={{
                                    height: '240px',
                                    fontSize: '1rem',
                                    lineHeight: '1.5',
                                    background: 'var(--bg-card-inner)',
                                    padding: '1.2rem',
                                    borderRadius: '14px',
                                    border: isRecording ? '2px solid var(--danger-subtle)' : '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    resize: 'none',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={saveNote}
                                className="btn btn-primary"
                                style={{ flex: 2, borderRadius: '50px', padding: '0.75rem' }}
                                disabled={!text.trim() && !interimTranscript}
                            >
                                {editingNoteId ? '💾 Update Note' : '📥 Save Note'}
                            </button>
                            {editingNoteId && (
                                <button
                                    onClick={() => { setEditingNoteId(null); setText(''); }}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, borderRadius: '50px' }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    <aside className="card" style={{ padding: 'var(--card-padding)', borderRadius: '24px', display: 'flex', flexDirection: 'column', height: 'fit-content', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Recent Notes</h3>
                            <button
                                onClick={downloadAll}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                disabled={savedNotes.length === 0}
                            >
                                ⬇️ Export
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                            {savedNotes.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    No notes saved yet. Start talking to see them here.
                                </p>
                            ) : (
                                savedNotes.map((note) => (
                                    <div key={note.id} style={{
                                        padding: '1.25rem',
                                        background: 'var(--bg-card-inner)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-subtle)',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                                            {note.text}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => readAloud(note.text)} title="Read Aloud" style={actionBtnStyle}>🔊</button>
                                                <button onClick={() => editNote(note)} title="Edit" style={actionBtnStyle}>✏️</button>
                                                <button onClick={() => deleteNote(note.id)} title="Delete" style={{ ...actionBtnStyle, color: 'var(--danger)' }}>🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            <style>{`
                .pulse {
                    animation: circle-pulse 2s infinite;
                }
                @keyframes circle-pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </Layout>
    );
};

const actionBtnStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
};


export default SpeechToText;
