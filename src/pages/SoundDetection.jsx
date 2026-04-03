import React, { useRef, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import FeatureGuide from '../components/FeatureGuide';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/eJRlxjb1B/";

const EMOJI_MAP = {
    "Door Bell": "🔔",
    "Knock Knock": "🚪",
    "Dog Barking": "🐕",
    "Baby Crying": "👶",
    "Fire Alarm": "🚨",
    "Clapping": "👏",
    "Siren": "🚑",
    "Glass Break": "🔨",
    "Background": "⬛",
    "_background_noise_": "⬛"
};

async function createModel() {
    const checkpointURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";
    const recognizer = window.speechCommands.create(
        "BROWSER_FFT",
        undefined,
        checkpointURL,
        metadataURL
    );
    await recognizer.ensureModelLoaded();
    return recognizer;
}

const SoundDetection = () => {
    // Refs
    const recognizerRef = useRef(null);
    const lastFired = useRef({});

    // State: UI & Controls
    const [isListening, setIsListening] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [activeBanner, setActiveBanner] = useState(null); // { name, emoji, score }
    const [topPrediction, setTopPrediction] = useState({ name: "Waiting...", confidence: 0 });
    const [labels, setLabels] = useState([]);

    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Fetch labels from metadata to display them before listening
        const fetchLabels = async () => {
            try {
                const response = await fetch(MODEL_URL + "metadata.json");
                const metadata = await response.json();
                setLabels(metadata.wordLabels || []);
            } catch (err) {
                console.error("Failed to load labels", err);
            }
        };
        fetchLabels();

        return () => stopListening();
    }, []);

    const fireAlert = (name, confidence) => {
        const emoji = EMOJI_MAP[name] || "📢";
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // 1. Add card to detection log
        const newAlert = {
            id: Date.now(),
            name,
            emoji,
            score: confidence,
            time: timeStr,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 10));

        // 2. Show popup banner at top for 4 seconds
        setActiveBanner({ name, emoji, score: confidence });
        setTimeout(() => setActiveBanner(null), 4000);

        // 3. Vibrate
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);

        // 4. Browser notification
        if (Notification.permission === "granted") {
            new Notification(`${emoji} Sound Detected: ${name}`, {
                body: `${confidence}% confidence at ${timeStr}`,
                icon: "/favicon.ico"
            });
        }

        // 5. Play short beep using AudioContext oscillator
        try {
            const beepCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = beepCtx.createOscillator();
            const gain = beepCtx.createGain();
            osc.connect(gain);
            gain.connect(beepCtx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start();
            setTimeout(() => {
                osc.stop();
                beepCtx.close();
            }, 300);
        } catch (e) {
            console.error("Beep error:", e);
        }
    };

    const startListening = async () => {
        try {
            setIsListening(true);
            setTopPrediction({ name: "Loading engine...", confidence: 0 });

            if (!recognizerRef.current) {
                recognizerRef.current = await createModel();
            }

            const recognizer = recognizerRef.current;
            const modelLabels = recognizer.wordLabels();
            setLabels(modelLabels);
            
            recognizer.listen(result => {
                const scores = result.scores;
                
                let highestScore = 0;
                let highestLabel = "";
                
                modelLabels.forEach((label, i) => {
                    if (
                        label !== "Background" &&
                        label !== "_background_noise_" &&
                        scores[i] > highestScore
                    ) {
                        highestScore = scores[i];
                        highestLabel = label;
                    }
                });
                
                const confidence = Math.round(highestScore * 100);
                setTopPrediction({ name: highestLabel || "Quiet", confidence });
                
                if (confidence > 80 && highestLabel !== "") {
                    const now = Date.now();
                    const last = lastFired.current[highestLabel] || 0;
                    if (now - last > 6000) {
                        lastFired.current[highestLabel] = now;
                        fireAlert(highestLabel, confidence);
                    }
                }
                
            }, {
                includeSpectrogram: false,
                probabilityThreshold: 0.75,
                overlapFactor: 0.5
            });

        } catch (err) {
            console.error("Listening error:", err);
            alert("Could not access microphone or load model.");
            setIsListening(false);
            setTopPrediction({ name: "Error", confidence: 0 });
        }
    };

    const stopListening = () => {
        setIsListening(false);
        if (recognizerRef.current) {
            try {
                recognizerRef.current.stopListening();
            } catch(e) {
                console.error(e);
            }
        }
        setTopPrediction({ name: "Stopped", confidence: 0 });
    };

    return (
        <Layout>
            {/* Top Match Banner */}
            {activeBanner && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent-gradient)', color: 'white', padding: '1rem 2.5rem',
                    borderRadius: '50px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', gap: '1.2rem', animation: 'bannerSlideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                    <span style={{ fontSize: '1.8rem' }}>{activeBanner.emoji}</span>
                    <div>
                        <div style={{ fontWeight: '900', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeBanner.name} DETECTED</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Confidence level: {activeBanner.score}%</div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 1.5rem' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <div className="section-label" style={{ marginBottom: '0.75rem', fontSize: '0.7rem' }}>Acoustic Intelligence v3</div>
                    <div style={{ display: 'flex', flexDirection: 'column', md: 'row', justifyContent: 'space-between', alignItems: 'flex-start', md: 'flex-end', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                                    Sound <span className="text-gradient">Classifier</span>
                                </h1>
                                <FeatureGuide
                                    title="Sound Classifier"
                                    steps={[
                                        { title: 'Start the Engine', description: 'Press "Start Engine" to activate the AI microphone listener. Allow mic access when prompted. The model runs fully on your device.' },
                                        { title: 'Real-time Detection', description: 'The AI continuously classifies ambient sounds. The confidence meter shows how sure the model is about the detected sound.' },
                                        { title: 'Alert System', description: 'When a sound is detected with >80% confidence, you get a banner, browser notification, vibration, and an audio beep alert.' },
                                        { title: 'Detection Log', description: 'All detected sounds with timestamps and confidence scores are shown in the Detection Log on the right side.' },
                                        { title: 'Supported Sounds', description: 'The AI recognizes: Doorbell, Knocking, Dog Barking, Baby Crying, Fire Alarm, Clapping, Siren, and Glass Breaking.' },
                                    ]}
                                />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                Teachable Machine AI. Fast, reliable, and completely private on-device detection.
                            </p>
                        </div>
                        <div style={{
                            padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem',
                            background: isListening ? 'var(--success-subtle)' : 'var(--bg-card-inner)',
                            color: isListening ? 'var(--success)' : 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)', fontWeight: '800'
                        }}>
                            {isListening ? "LISTENING ACTIVE" : "ENGINE READY"}
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">

                    {/* Left Column */}
                    <div style={{ flex: 1.2, width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Control Card */}
                        <div className="card" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    style={{
                                        width: '100%', padding: '1rem', minHeight: '48px',
                                        background: isListening ? 'var(--danger)' : 'var(--accent-gradient)',
                                        fontSize: '1rem', borderRadius: '50px',
                                        color: 'white', fontWeight: '900', border: 'none', cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {isListening ? '🛑 STOP MONITORING' : '👂 START ENGINE'}
                                </button>
                        </div>

                        {/* Real-time Classification Section */}
                        <div className="card" style={{ padding: 'var(--card-padding)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Real-time Classification</h3>

                            {!isListening ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.5 }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎙️</div>
                                    <p style={{ fontWeight: '700' }}>Engine is idle.</p>
                                    <p style={{ fontSize: '0.8rem' }}>Start monitoring to see predictions.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Current Sound</span>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '900', fontSize: '2rem' }}>{topPrediction.name}</span>
                                            <span style={{ fontWeight: '900', fontSize: '1.5rem' }}>{topPrediction.confidence}%</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{ height: '12px', background: 'var(--bg-card-inner)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${Math.min(100, topPrediction.confidence)}%`, 
                                                height: '100%', 
                                                background: topPrediction.confidence > 80 ? 'var(--success)' : (topPrediction.confidence >= 50 ? '#eab308' : 'gray'), 
                                                transition: 'width 0.3s ease, background 0.3s ease' 
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Configured Alerts at Bottom */}
                        <div className="card" style={{ padding: 'var(--card-padding)', background: 'var(--bg-card-inner)' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Configured Alert Tags</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                {labels.length > 0 ? labels.map(label => {
                                    if (label === '_background_noise_' || label === 'Background') return null;
                                    return (
                                        <span key={label} style={{ 
                                            padding: '0.5rem 1rem', background: 'var(--bg-card)', borderRadius: '12px', 
                                            fontSize: '0.85rem', fontWeight: '700', border: '1px solid var(--border-subtle)',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}>
                                            <span>{EMOJI_MAP[label] || "📢"}</span> {label}
                                        </span>
                                    );
                                }) : (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading model metadata...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Detection Log */}
                    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: 'var(--card-padding)', flex: 1, minHeight: '400px', md: '650px', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.8rem', letterSpacing: '-0.01em' }}>
                                    DETECTION LOG {isListening && <div style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />}
                                </h3>
                                {alerts.length > 0 && (
                                    <button onClick={() => setAlerts([])} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer' }}>
                                        CLEAR LOG
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {alerts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '10rem 2rem', opacity: 0.3 }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📡</div>
                                        <p style={{ fontWeight: '800', fontSize: '1rem' }}>Waiting for recognizable sounds...</p>
                                        <p style={{ fontSize: '0.85rem', marginTop: '0.8rem' }}>Alerts will trigger based on AI confidence.</p>
                                    </div>
                                ) : (
                                    alerts.map(alert => (
                                        <div key={alert.id} style={{
                                            padding: '1.5rem', background: 'var(--bg-card-inner)', borderRadius: '20px',
                                            border: '1px solid var(--border-subtle)', borderLeft: `8px solid ${alert.color}`,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                                <div style={{ fontSize: '2rem' }}>{alert.emoji}</div>
                                                <div>
                                                    <div style={{ fontWeight: '900', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.1rem' }}>{alert.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{alert.time}</div>
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '0.6rem 1rem', borderRadius: '12px', background: 'var(--accent-primary)',
                                                color: 'white', fontWeight: '900', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                            }}>
                                                {alert.score}% CONF.
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.3; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes bannerSlideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(15px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </Layout>
    );
};

export default SoundDetection;
