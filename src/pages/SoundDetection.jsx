import React, { useRef, useEffect, useState } from 'react';
import Layout from '../components/Layout';

const BUILT_IN_SOUNDS = [
    { name: "Fire Alarm", emoji: "🚨", freqMin: 2500, freqMax: 4000, minAmplitude: 55 },
    { name: "Doorbell", emoji: "🔔", freqMin: 900, freqMax: 1200, minAmplitude: 40 },
    { name: "Baby Crying", emoji: "👶", freqMin: 250, freqMax: 600, minAmplitude: 35 },
    { name: "Dog Barking", emoji: "🐕", freqMin: 300, freqMax: 800, minAmplitude: 38 },
    { name: "Clapping", emoji: "👏", freqMin: 200, freqMax: 1000, minAmplitude: 30 },
    { name: "Loud Noise", emoji: "📢", freqMin: 100, freqMax: 8000, minAmplitude: 70 },
];

const SoundDetection = () => {
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);
    const lastFired = useRef({});

    const [isListening, setIsListening] = useState(false);
    const [volume, setVolume] = useState(0);
    const [bars, setBars] = useState(new Array(30).fill(3));
    const [alerts, setAlerts] = useState([]);
    const [sensitivity, setSensitivity] = useState(50);
    const [registeredSounds, setRegisteredSounds] = useState(() => {
        const saved = localStorage.getItem('registeredSounds');
        return saved ? JSON.parse(saved) : [];
    });

    const [isRecordingSample, setIsRecordingSample] = useState(false);
    const [sampleName, setSampleName] = useState("");
    const [recordingProgress, setRecordingProgress] = useState(0);

    // PERSIST Registered Sounds
    useEffect(() => {
        localStorage.setItem('registeredSounds', JSON.stringify(registeredSounds));
    }, [registeredSounds]);

    // Step 4 - Request notification permission on load
    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopListening();
    }, []);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;
            sourceRef.current = source;
            setIsListening(true);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const binHz = (audioCtx.sampleRate / 2) / dataArray.length;

            const tick = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);

                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setVolume(Math.round((avg / 255) * 100));

                const chunk = Math.floor(dataArray.length / 30);
                setBars(Array.from({ length: 30 }, (_, i) => Math.max(3, dataArray[i * chunk] / 2.5)));

                let maxVal = 0, maxBin = 0;
                dataArray.forEach((v, i) => { if (v > maxVal) { maxVal = v; maxBin = i; } });
                const peakHz = maxBin * binHz;

                // Adjust Amplitude Threshold by Sensitivity
                const sensitivityFactor = (100 - sensitivity) / 20; // range correction

                // Check Built-in Sounds
                BUILT_IN_SOUNDS.forEach(sound => {
                    const dynamicMinAmp = sound.minAmplitude + sensitivityFactor;
                    if (peakHz >= sound.freqMin && peakHz <= sound.freqMax && avg >= dynamicMinAmp) {
                        const now = Date.now();
                        if (!lastFired.current[sound.name] || now - lastFired.current[sound.name] > 4000) {
                            lastFired.current[sound.name] = now;
                            fireAlert(sound.name, sound.emoji);
                        }
                    }
                });

                // Check Registered Sounds
                registeredSounds.forEach(sound => {
                    // Fingerprint comparison (Simplified similarity check)
                    const similarity = compareFingerprint(dataArray, sound.fingerprint);
                    if (similarity > 0.85 && avg > 15 + sensitivityFactor) {
                        const now = Date.now();
                        if (!lastFired.current[sound.name] || now - lastFired.current[sound.name] > 4000) {
                            lastFired.current[sound.name] = now;
                            fireAlert(sound.name, "🎙️");
                        }
                    }
                });

                requestRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch (err) {
            console.error("Microphone error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopListening = () => {
        setIsListening(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (sourceRef.current && sourceRef.current.mediaStream) {
            sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
        }
        audioCtxRef.current = null;
        analyserRef.current = null;
    };

    const compareFingerprint = (live, saved) => {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < live.length; i++) {
            dotProduct += live[i] * saved[i];
            normA += live[i] * live[i];
            normB += saved[i] * saved[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const recordSample = () => {
        if (!sampleName) {
            alert("Please enter a name for the custom sound.");
            return;
        }
        if (!isListening) {
            alert("Please start listening first to record a sample.");
            return;
        }

        setIsRecordingSample(true);
        setRecordingProgress(0);

        let snapshots = [];
        const duration = 3000; // 3 seconds
        const interval = 100;
        const totalSteps = duration / interval;
        let currentStep = 0;

        const recordTimer = setInterval(() => {
            currentStep++;
            setRecordingProgress((currentStep / totalSteps) * 100);

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            snapshots.push(new Uint8Array(dataArray));

            if (currentStep >= totalSteps) {
                clearInterval(recordTimer);

                // Average the snapshots to create fingerprint
                const binCount = snapshots[0].length;
                const fingerprint = new Float32Array(binCount);
                for (let i = 0; i < binCount; i++) {
                    let sum = 0;
                    for (let j = 0; j < snapshots.length; j++) sum += snapshots[j][i];
                    fingerprint[i] = sum / snapshots.length;
                }

                setRegisteredSounds(prev => [{
                    id: Date.now(),
                    name: sampleName,
                    fingerprint: Array.from(fingerprint)
                }, ...prev]);

                setIsRecordingSample(false);
                setSampleName("");
                setRecordingProgress(0);
                alert(`Registered "${sampleName}" successfully!`);
            }
        }, interval);
    };

    const fireAlert = (name, emoji) => {
        setAlerts(prev => [{
            id: Date.now(),
            name,
            emoji,
            time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 30));

        // Visual flash
        document.body.style.outline = "6px solid red";
        document.body.style.outlineOffset = "-6px";
        setTimeout(() => {
            document.body.style.outline = "none";
        }, 800);

        // Vibration
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);

        // Browser notification
        if (Notification.permission === "granted") {
            new Notification(`${emoji} ${name} Detected!`, {
                body: `Detected at ${new Date().toLocaleTimeString()}`,
                icon: "/favicon.ico"
            });
        }
    };

    const clearAlerts = () => setAlerts([]);

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                <header style={{ marginBottom: '4rem' }}>
                    <div className="section-label">Acoustic Perception</div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                        Sound <span className="text-gradient">Alerter</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                        Transforming environment sound into visual and sensory notifications.
                    </p>
                </header>

                <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
                    {/* Left: Visualizer & Controls */}
                    <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {/* 30 Animated Bars */}
                        <div style={{
                            height: '240px', background: '#f8f9ff', borderRadius: '24px',
                            display: 'flex', alignItems: 'flex-end', gap: '6px', padding: '1.5rem',
                            border: '1px solid var(--border-light)'
                        }}>
                            {bars.map((h, i) => (
                                <div key={i} style={{
                                    flex: 1, height: `${h}%`, background: isListening ? 'var(--accent-gradient)' : '#e2e8f0',
                                    borderRadius: '10px', transition: 'height 0.05s linear'
                                }} />
                            ))}
                        </div>

                        {/* Intensity Meter */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>INPUT INTENSITY</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: volume > 70 ? '#ef4444' : 'var(--accent-primary)' }}>{volume}%</span>
                            </div>
                            <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${volume}%`, height: '100%',
                                    background: volume > 70 ? 'linear-gradient(90deg, #7c3aed, #ef4444)' : 'var(--accent-gradient)',
                                    transition: 'width 0.1s ease-out'
                                }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <button
                                onClick={isListening ? stopListening : startListening}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '1.5rem', background: isListening ? '#ef4444' : 'var(--accent-gradient)' }}
                            >
                                {isListening ? '🛑 Stop Listening' : '👂 Start Listening'}
                            </button>

                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    SENSITIVITY: {sensitivity}
                                </label>
                                <input
                                    type="range" value={sensitivity} onChange={e => setSensitivity(e.target.value)}
                                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                                />
                            </div>
                        </div>

                        {/* Custom Registration UI */}
                        <div style={{
                            padding: '1.5rem', background: '#f5f3ff', borderRadius: '20px',
                            border: '1px solid #ddd6fe', marginTop: '1rem'
                        }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.2rem', color: '#6d28d9' }}>Register Custom Sound</h4>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text" value={sampleName} onChange={e => setSampleName(e.target.value)}
                                    placeholder="Sound name (e.g. Doorbell)"
                                    style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                    disabled={isRecordingSample}
                                />
                                <button
                                    onClick={recordSample}
                                    className="btn btn-secondary"
                                    style={{ position: 'relative', overflow: 'hidden' }}
                                    disabled={isRecordingSample || !isListening}
                                >
                                    {isRecordingSample ? `Recording (${Math.round(recordingProgress)}%)` : '🎙️ Record Sample'}
                                    {isRecordingSample && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, height: '4px',
                                            background: 'var(--accent-primary)', width: `${recordingProgress}%`
                                        }} />
                                    )}
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.8rem' }}>
                                Describe the sound and record a 3-second sample for local signature matching.
                            </p>
                        </div>
                    </div>

                    {/* Right: Live Alerts & Signatures */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {/* Live Alerts */}
                        <div className="card" style={{ padding: '2rem', height: 'fit-content', minHeight: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    LIVE ALERTS {isListening && <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />}
                                </h3>
                                {alerts.length > 0 && <button onClick={clearAlerts} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem' }}>CLEAR ALL</button>}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {alerts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '5rem 0', opacity: 0.5 }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👂</div>
                                        <p style={{ fontWeight: '700' }}>Listening for sounds...</p>
                                    </div>
                                ) : (
                                    alerts.map(alert => (
                                        <div key={alert.id} className="alert-item" style={{
                                            padding: '1.2rem', background: 'var(--bg-page)', borderRadius: '16px',
                                            border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1.2rem',
                                            animation: 'slideIn 0.3s ease-out'
                                        }}>
                                            <div style={{ fontSize: '2rem' }}>{alert.emoji}</div>
                                            <div>
                                                <div style={{ fontWeight: '900', color: 'var(--text-primary)' }}>{alert.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detected at {alert.time}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Registered Signatures */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>ACOUSTIC SIGNATURES</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                {BUILT_IN_SOUNDS.map(s => (
                                    <div key={s.name} style={{
                                        padding: '0.6rem 1rem', background: '#f8f9ff', borderRadius: '100px',
                                        fontSize: '0.8rem', fontWeight: '700', border: '1px solid var(--border-light)',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}>
                                        <span>{s.emoji}</span> {s.name}
                                    </div>
                                ))}
                                {registeredSounds.map(s => (
                                    <div key={s.id} style={{
                                        padding: '0.6rem 1rem', background: '#fffbeb', borderRadius: '100px',
                                        fontSize: '0.8rem', fontWeight: '700', border: '1px solid #fef3c7',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e'
                                    }}>
                                        <span>🎙️</span> {s.name}
                                        <button
                                            onClick={() => setRegisteredSounds(prev => prev.filter(rs => rs.id !== s.id))}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, marginLeft: '0.3rem' }}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .alert-item {
                    transition: transform 0.2s;
                }
                .alert-item:hover {
                    transform: scale(1.02);
                }
            `}</style>
        </Layout>
    );
};

export default SoundDetection;
