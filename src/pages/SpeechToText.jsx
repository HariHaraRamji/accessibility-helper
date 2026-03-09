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
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '100px',
                        background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: isRecording ? '#ef4444' : 'var(--accent-primary)',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '1.5rem',
                        border: `1px solid ${isRecording ? '#ef444440' : 'var(--accent-primary)40'}`,
                        boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none'
                    }}>
                        <span className={isRecording ? 'pulse' : ''}>
                            {isRecording ? '🔴 Recording' : '🎙️ Ready'}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }} className="text-gradient">Voice Notes</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                        High-accuracy transcription with secure offline storage.
                    </p>
                </header>

                <div className="grid" style={{ gridTemplateColumns: '1fr 400px', gap: '2.5rem', alignItems: 'start' }}>
                    <div className="card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                            <button
                                onClick={toggleRecording}
                                style={{
                                    width: '120px', height: '120px',
                                    borderRadius: '50%',
                                    background: isRecording
                                        ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                                        : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '3rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    margin: '0 auto 1.5rem'
                                }}
                            >
                                {isRecording ? '⏹️' : '🎙️'}
                            </button>
                            <label style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                                {isRecording ? 'TAP TO STOP' : 'TAP TO RECORD'}
                            </label>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '800', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                TRANSCRIPT
                            </label>
                            <textarea
                                value={text + (interimTranscript ? (text ? ' ' : '') + interimTranscript : '')}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Your words will appear here..."
                                style={{
                                    height: '300px',
                                    fontSize: '1.2rem',
                                    lineHeight: '1.6',
                                    background: '#f8f9ff',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: isRecording ? '2px solid #ef444440' : '1px solid #e2e8f0',
                                    color: '#334155',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={saveNote}
                                className="btn btn-primary"
                                style={{ flex: 2, borderRadius: '100px', padding: '1.25rem' }}
                                disabled={!text.trim() && !interimTranscript}
                            >
                                {editingNoteId ? '💾 Update Note' : '📥 Save Note'}
                            </button>
                            {editingNoteId && (
                                <button
                                    onClick={() => { setEditingNoteId(null); setText(''); }}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, borderRadius: '100px' }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    <aside className="card" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', height: 'fit-content', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Recent Notes</h3>
                            <button
                                onClick={downloadAll}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                                disabled={savedNotes.length === 0}
                            >
                                ⬇️ Export
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '600px', overflowY: 'auto' }}>
                            {savedNotes.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    No notes saved yet. Start talking to see them here.
                                </p>
                            ) : (
                                savedNotes.map((note) => (
                                    <div key={note.id} style={{
                                        padding: '1.25rem',
                                        background: '#f8f9ff',
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem', color: '#0f172a', fontWeight: '500' }}>
                                            {note.text}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => readAloud(note.text)} title="Read Aloud" style={actionBtnStyle}>🔊</button>
                                                <button onClick={() => editNote(note)} title="Edit" style={actionBtnStyle}>✏️</button>
                                                <button onClick={() => deleteNote(note.id)} title="Delete" style={{ ...actionBtnStyle, color: '#ef4444' }}>🗑️</button>
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
    background: '#fff',
    border: '1px solid #e2e8f0',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
};


export default SpeechToText;
