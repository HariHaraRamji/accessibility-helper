import React, { useRef, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Gemini Configuration ---
// I'll expect an API_KEY in localStorage or a standard place.
// If not found, I'll allow the user to set it or just catch the error.
const GEMINI_API_KEY = localStorage.getItem("GEMINI_API_KEY") || "";

// --- Helper: Load external script (kept for backward compatibility, but we might not need coco-ssd anymore) ---
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load: " + src));
        document.head.appendChild(s);
    });
}

const ObjectDetection = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const modelRef = useRef(null); // coco-ssd (optional fallback)
    const frameRef = useRef(null);
    const voiceEnabledRef = useRef(true); 
    const lastSpokenRef = useRef(""); 
    const isProcessingRef = useRef(false);

    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    
    // Gemini 5-Field State
    const [geminiResult, setGeminiResult] = useState({
        guidance: "",
        objects: [],
        hazards: "",
        distance: "",
        direction: ""
    });

    const [apiKeyEntered, setApiKeyEntered] = useState(!!GEMINI_API_KEY);
    const [tempKey, setTempKey] = useState("");

    // Keep voiceEnabledRef in sync
    useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

    // --- Voice Implementation ---
    const speak = (msg) => {
        if (!voiceEnabledRef.current) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    // --- Gemini Call & Parsing ---
    async function captureFrameAsBase64() {
        const canvas = document.createElement("canvas");
        const video = videoRef.current;
        if (!video) return null;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    }

    async function callGeminiVision() {
        if (isProcessingRef.current || status !== "running") return;
        isProcessingRef.current = true;

        try {
            const base64Image = await captureFrameAsBase64();
            if (!base64Image) {
                isProcessingRef.current = false;
                return;
            }

            const genAI = new GoogleGenerativeAI(localStorage.getItem("GEMINI_API_KEY") || GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `You are an AI assistant helping a blind person navigate safely. Analyze this image carefully and respond in exactly this format:

GUIDANCE: [One short navigation instruction like: Path is clear, Door ahead, Wall on left, Step down ahead, Obstacle blocking path]

OBJECTS: [List everything visible including walls, doors, floor, ceiling, steps, furniture, people, windows, any object]

HAZARDS: [List specific dangers like: wall blocking path, door closed ahead, step down, low ceiling, wet floor, or say: none]

DISTANCE: [Estimate how far main obstacle is: very close under 1 meter, close 1 to 2 meters, far more than 2 meters]

DIRECTION: [Where to move safely: move left, move right, move forward, stop]`;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
            ]);
            
            const responseText = result.response.text();
            parseGeminiResponse(responseText);
        } catch (err) {
            console.error("Gemini Error:", err);
            // If it's an API Key error, show specific message
            if (err.message.includes("API key")) {
                setError("Invalid API Key. Please update it in the settings.");
            }
        } finally {
            isProcessingRef.current = false;
        }
    }

    function parseGeminiResponse(text) {
        const lines = text.split('\n');
        const extracted = {
            guidance: "",
            objects: [],
            hazards: "",
            distance: "",
            direction: ""
        };

        lines.forEach(line => {
            if (line.startsWith("GUIDANCE:")) extracted.guidance = line.replace("GUIDANCE:", "").trim();
            if (line.startsWith("OBJECTS:")) extracted.objects = line.replace("OBJECTS:", "").replace(/[\[\]]/g, "").split(",").map(o => o.trim()).filter(o => o);
            if (line.startsWith("HAZARDS:")) extracted.hazards = line.replace("HAZARDS:", "").trim();
            if (line.startsWith("DISTANCE:")) extracted.distance = line.replace("DISTANCE:", "").trim();
            if (line.startsWith("DIRECTION:")) extracted.direction = line.replace("DIRECTION:", "").trim();
        });

        // Update state
        setGeminiResult(extracted);

        // --- Handle Voice Announcement: GUIDANCE + DIRECTION ---
        const voiceMsg = `${extracted.guidance}. ${extracted.direction}.`;
        if (voiceMsg !== lastSpokenRef.current) {
            lastSpokenRef.current = voiceMsg;
            speak(voiceMsg);
        }
    }

    // --- Main Start/Stop Logic ---
    async function startVisionAgent() {
        const key = localStorage.getItem("GEMINI_API_KEY");
        if (!key) {
            setError("Please provide a Gemini API Key first.");
            setStatus("error");
            return;
        }

        setStatus("starting-camera");
        setError("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            if (!videoRef.current) throw new Error("Video element missing");

            videoRef.current.srcObject = stream;
            await new Promise(resolve => {
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    resolve();
                };
            });

            setStatus("running");
        } catch (err) {
            console.error(err);
            setError(err.name === "NotAllowedError" ? "Camera permission denied." : "Error: " + err.message);
            setStatus("error");
        }
    }

    function stopVisionAgent() {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        window.speechSynthesis.cancel();
        setStatus("idle");
        setGeminiResult({ guidance: "", objects: [], hazards: "", distance: "", direction: "" });
        lastSpokenRef.current = "";
    }

    // Gemini Loop
    useEffect(() => {
        let interval;
        if (status === "running") {
            // Call immediately
            callGeminiVision();
            // Then every 4 seconds (Gemini Vision is slower and more expensive)
            interval = setInterval(callGeminiVision, 4000);
        }
        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        return () => stopVisionAgent();
    }, []);

    const saveApiKey = () => {
        if (tempKey.startsWith("AIza")) {
            localStorage.setItem("GEMINI_API_KEY", tempKey);
            setApiKeyEntered(true);
            setError("");
        } else {
            setError("Invalid API Key format.");
        }
    };

    const getGuidanceStyles = () => {
        const g = geminiResult.guidance.toLowerCase();
        if (g.includes("clear")) return { bg: "rgba(34, 197, 94, 0.15)", border: "#22c55e", text: "#22c55e" };
        if (g.includes("stop") || g.includes("danger") || g.includes("obstacle")) return { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", text: "#ef4444" };
        return { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", text: "#f59e0b" };
    };

    const getDirectionIcon = () => {
        const d = geminiResult.direction.toLowerCase();
        if (d.includes("forward")) return "⬆️";
        if (d.includes("left")) return "⬅️";
        if (d.includes("right")) return "➡️";
        if (d.includes("stop")) return "🛑";
        return "❓";
    };

    return (
        <Layout>
            <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 1.5rem' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <div className="section-label" style={{ marginBottom: '0.75rem', fontSize: '0.7rem' }}>Gemini Intelligence v2</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                                Smart <span className="text-gradient">Vision</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                Advanced navigation engine powered by Gemini Vision AI.
                            </p>
                        </div>
                        {status === "running" && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="pulsing-dot" />
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--success, #22c55e)' }}>LIVE</span>
                            </div>
                        )}
                    </div>
                </header>

                {!apiKeyEntered && (
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '2px dashed #a855f7', marginBottom: '2rem', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🔑 Setup Gemini API Key</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>A Gemini API key is required for spatial analysis. It is stored only in your browser.</p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <input 
                                type="password" 
                                value={tempKey} 
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="Paste API Key (AIza...)"
                                style={{ padding: '0.8rem 1.2rem', borderRadius: '50px', border: '1px solid var(--border-subtle)', flex: 1, maxWidth: '300px', background: 'var(--bg-card-inner)', color: 'var(--text-primary)' }}
                            />
                            <button onClick={saveApiKey} style={{ padding: '0.8rem 1.5rem', background: '#a855f7', color: '#fff', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: '800' }}>Save Key</button>
                        </div>
                        {error && <p style={{ color: '#ef4444', marginTop: '0.8rem', fontSize: '0.8rem' }}>{error}</p>}
                    </div>
                )}

                {geminiResult.hazards && geminiResult.hazards.toLowerCase() !== "none" && (
                    <div style={{
                        background: '#ef4444', color: '#fff', padding: '1.2rem',
                        textAlign: 'center', fontWeight: '900', fontSize: '1.1rem',
                        borderRadius: '16px', marginBottom: '1.5rem',
                        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                        animation: 'flash 0.5s infinite alternate'
                    }}>
                        ⚠️ HAZARDS DETECTED: {geminiResult.hazards.toUpperCase()}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                    {/* Viewport Column */}
                    <div style={{ flex: 1.4 }}>
                        <div className="card" style={{ padding: '0.5rem', background: '#000', borderRadius: '20px', position: 'relative', overflow: 'hidden', minHeight: '300px', md: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                            {status === "idle" || status === "error" ? (
                                <div style={{ textAlign: 'center', color: '#fff', zIndex: 10 }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>👁️</div>
                                    <button
                                        onClick={startVisionAgent}
                                        style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '50px', background: '#a855f7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)' }}
                                    >
                                        Activate Vision Agent
                                    </button>
                                    {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontWeight: '800', fontSize: '0.9rem' }}>{error}</p>}
                                </div>
                            ) : (
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', display: 'block', borderRadius: '16px' }} />
                                    {isProcessingRef.current && (
                                        <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', padding: '0.5rem 1rem', borderRadius: '50px', color: '#fff', fontSize: '0.7rem', fontWeight: '800', zIndex: 30, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className="spinning" style={{ width: '10px', height: '10px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                            ANALYZING...
                                        </div>
                                    )}
                                    {geminiResult.distance && (
                                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'var(--accent-gradient)', padding: '0.5rem 1rem', borderRadius: '50px', color: '#fff', fontSize: '0.8rem', fontWeight: '900', zIndex: 30 }}>
                                            📏 {geminiResult.distance.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem' }}>
                            {(status !== "idle" && status !== "error") && (
                                <button onClick={stopVisionAgent} style={{ background: 'var(--danger)', color: '#fff', flex: 1, padding: '1rem', minHeight: '48px', fontWeight: '800', borderRadius: '50px', fontSize: '0.9rem', cursor: 'pointer', border: 'none' }}>
                                    Stop Agent
                                </button>
                            )}
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                style={{ flex: 1, padding: '1rem', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', borderRadius: '50px', fontSize: '0.9rem', cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            >
                                {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Info Column */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Live guidance status card */}
                        <div className="card" style={{ 
                            padding: 'var(--card-padding)', 
                            backgroundColor: getGuidanceStyles().bg, 
                            border: `2px solid ${getGuidanceStyles().border}`,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.1em', color: getGuidanceStyles().text }}>LIVE GUIDANCE</h3>
                                <span style={{ fontSize: '2rem' }}>{getDirectionIcon()}</span>
                             </div>
                            <p style={{
                                color: getGuidanceStyles().text,
                                fontSize: '1.4rem', lineHeight: '1.3', fontWeight: '900', margin: 0
                            }}>
                                {geminiResult.guidance || (status === 'running' ? 'Capturing scene...' : 'Engine Idle')}
                            </p>
                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: getGuidanceStyles().text, opacity: 0.8 }}>
                                ACTION: {geminiResult.direction.toUpperCase() || "PENDING"}
                            </div>
                        </div>

                        <div className="card" style={{ padding: 'var(--card-padding)', flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease', minHeight: '200px' }}>
                            <h3 style={{ fontSize: '0.75rem', marginBottom: '1.2rem', fontWeight: '900', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>SCENE OBJECTS</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                {geminiResult.objects.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', opacity: 0.5, fontSize: '0.9rem' }}>{status === "running" ? "Analyzing..." : "Pending start..."}</p>
                                ) : (
                                    geminiResult.objects.map((obj, i) => (
                                        <div key={i} style={{
                                            padding: '0.5rem 0.8rem', background: 'var(--bg-card-inner)', borderRadius: '10px',
                                            border: '1px solid var(--border-subtle)',
                                            fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}>
                                            <span style={{ color: '#a855f7' }}>#</span>
                                            {obj}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes flash {
                    from { opacity: 0.8; }
                    to { opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
                .text-gradient {
                    background: var(--accent-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .pulsing-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background-color: var(--success, #22c55e);
                    animation: pulse-dot 1s infinite alternate;
                }
                @keyframes pulse-dot {
                    0% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    100% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 10px 4px rgba(34, 197, 94, 0.4); }
                }
            `}</style>
        </Layout>
    );
};

export default ObjectDetection;

