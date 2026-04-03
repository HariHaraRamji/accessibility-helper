import React, { useRef, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import FeatureGuide from '../components/FeatureGuide';

const ObjectDetection = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const modelRef = useRef(null);
    const requestRef = useRef(null);
    const voiceEnabledRef = useRef(true);
    const lastSpokenRef = useRef("");
    const lastAnnouncementTime = useRef(0);

    const [status, setStatus] = useState("loading-model");
    const [error, setError] = useState("");
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    // 5-Field State (matches Gemini v2 format but generated locally)
    const [results, setResults] = useState({
        guidance: "Initializing engine...",
        objects: [],
        hazards: "None",
        distance: "Calculating...",
        direction: "Standing by"
    });

    // In sync with ref for the loop
    useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

    // --- Voice Implementation ---
    const speak = (msg) => {
        if (!voiceEnabledRef.current || !msg) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.rate = 1.0;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    // --- Model Loading ---
    useEffect(() => {
        async function loadModel() {
            try {
                // Ensure tf is ready
                if (!window.tf) {
                    throw new Error("TensorFlow.js not loaded. Check your connection.");
                }
                const model = await window.cocoSsd.load();
                modelRef.current = model;
                setStatus("idle");
            } catch (err) {
                console.error("Model load error:", err);
                setError("Failed to load local AI model: " + err.message);
                setStatus("error");
            }
        }
        loadModel();
    }, []);

    // --- Core Detection Loop ---
    const MIN_CONFIDENCE = 0.45; // Filter noisy detections

    const detectFrame = async () => {
        if (!videoRef.current || !modelRef.current || status !== "running") return;

        try {
            const rawDetections = await modelRef.current.detect(videoRef.current);
            // Filter by confidence to eliminate sloppy oversized boxes
            const detections = rawDetections.filter(d => d.score >= MIN_CONFIDENCE);
            analyzeDetections(detections);
            drawBoundingBoxes(detections);
        } catch (err) {
            console.error("Detection error:", err);
        }

        requestRef.current = requestAnimationFrame(detectFrame);
    };

    const drawBoundingBoxes = (detections) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext("2d");
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        canvas.width = vw;
        canvas.height = vh;
        ctx.clearRect(0, 0, vw, vh);

        detections.forEach(det => {
            // Clamp bbox to actual frame
            let [x, y, w, h] = det.bbox;
            x = Math.max(0, x);
            y = Math.max(0, y);
            w = Math.min(w, vw - x);
            h = Math.min(h, vh - y);

            const conf = Math.round(det.score * 100);
            const isClose = h / vh > 0.7;
            const boxColor = isClose ? "#ef4444" : "#a855f7";

            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            // Label background
            const label = `${det.class} ${conf}%`;
            ctx.font = "bold 14px Inter, sans-serif";
            const textW = ctx.measureText(label).width + 12;
            const labelY = y > 24 ? y - 24 : y + h + 4;
            ctx.fillStyle = boxColor;
            ctx.fillRect(x, labelY, textW, 22);
            ctx.fillStyle = "#fff";
            ctx.fillText(label, x + 6, labelY + 16);
        });
    };

    // --- Spatial helpers ---
    const getPositionLabel = (centerX, vw) => {
        const pct = centerX / vw;
        if (pct < 0.2) return "far left";
        if (pct < 0.4) return "left";
        if (pct <= 0.6) return "directly ahead";
        if (pct <= 0.8) return "right";
        return "far right";
    };

    const getZone = (centerX, vw) => {
        const pct = centerX / vw;
        if (pct < 0.33) return "left";
        if (pct <= 0.66) return "center";
        return "right";
    };

    // Distance uses AREA RATIO (bbox area / frame area), much more reliable than
    // height alone because COCO-SSD pads boxes vertically making height unreliable.
    const getDistanceLabel = (areaRatio, hPct) => {
        // Primary metric: area ratio — how much of the frame the object fills
        // Secondary metric: height ratio as a sanity check
        if (areaRatio > 0.45 && hPct > 0.8) return { label: "Very Close (Under 1m)", level: 3 };
        if (areaRatio > 0.25 && hPct > 0.6) return { label: "Close (1-2m)", level: 2 };
        if (areaRatio > 0.08) return { label: "Moderate (2-4m)", level: 1 };
        if (areaRatio > 0.02) return { label: "Nearby (4-6m)", level: 0 };
        return { label: "Far (>6m)", level: 0 };
    };

    const analyzeDetections = (detections) => {
        const video = videoRef.current;
        if (!video) return;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const frameArea = vw * vh;

        // 1. OBJECTS: Unique classes
        const objectList = [...new Set(detections.map(d => d.class))];

        // 2. Default safe state
        let guidance = "Path is clear. Move forward.";
        let direction = "Move Forward";
        let hazards = "None";
        let distance = "Clear";

        if (detections.length === 0) {
            setResults({ guidance, objects: objectList, hazards, distance, direction });
            const now = Date.now();
            const voiceMsg = `${guidance}`;
            if (status === "running" && (voiceMsg !== lastSpokenRef.current || now - lastAnnouncementTime.current > 5000)) {
                lastSpokenRef.current = voiceMsg;
                lastAnnouncementTime.current = now;
                speak(voiceMsg);
            }
            return;
        }

        // 3. Enrich each detection with clamped position + distance info
        const enriched = detections.map(det => {
            let [x, y, w, h] = det.bbox;
            // Clamp to frame boundaries — COCO-SSD boxes can extend outside
            x = Math.max(0, x);
            y = Math.max(0, y);
            w = Math.min(w, vw - x);
            h = Math.min(h, vh - y);

            const centerX = x + w / 2;
            const area = w * h;
            const areaRatio = area / frameArea;
            const hPct = h / vh;
            const position = getPositionLabel(centerX, vw);
            const zone = getZone(centerX, vw);
            const dist = getDistanceLabel(areaRatio, hPct);
            return { ...det, centerX, area, areaRatio, hPct, position, zone, dist, clampedBbox: [x, y, w, h] };
        });

        // Sort by threat level: closest + biggest first
        enriched.sort((a, b) => b.dist.level - a.dist.level || b.area - a.area);

        const topThreat = enriched[0];

        // 4. Zone occupancy for avoidance routing
        const zoneOccupancy = { left: 0, center: 0, right: 0 };
        enriched.forEach(det => {
            zoneOccupancy[det.zone] += det.area;
        });

        // 5. Build guidance based on threat level and position
        const threatClass = topThreat.class;
        const threatPos = topThreat.position;
        const threatDist = topThreat.dist;

        distance = threatDist.label;
        hazards = enriched.filter(d => d.dist.level >= 2).map(d => d.class).join(", ") || "None";

        if (threatDist.level === 3) {
            // VERY CLOSE — urgent
            if (threatPos === "directly ahead") {
                guidance = `${threatClass} directly ahead, very close. Stop immediately.`;
                direction = "Stop";
            } else if (threatPos.includes("left")) {
                guidance = `${threatClass} very close on your ${threatPos}. Move right.`;
                direction = "Move Right";
            } else {
                guidance = `${threatClass} very close on your ${threatPos}. Move left.`;
                direction = "Move Left";
            }
        } else if (threatDist.level === 2) {
            // CLOSE — navigate around
            if (threatPos === "directly ahead") {
                // Find the clearer side
                if (zoneOccupancy.left <= zoneOccupancy.right) {
                    guidance = `${threatClass} ahead, close. Move left to avoid.`;
                    direction = "Move Left";
                } else {
                    guidance = `${threatClass} ahead, close. Move right to avoid.`;
                    direction = "Move Right";
                }
            } else if (threatPos.includes("left")) {
                guidance = `${threatClass} on your ${threatPos}, close. Stay right.`;
                direction = "Keep Right";
            } else {
                guidance = `${threatClass} on your ${threatPos}, close. Stay left.`;
                direction = "Keep Left";
            }
        } else if (threatDist.level === 1) {
            // MODERATE — awareness
            if (threatPos === "directly ahead") {
                guidance = `${threatClass} ahead at moderate distance. Proceed with caution.`;
                direction = "Slow Down";
            } else {
                guidance = `${threatClass} on your ${threatPos}. Path mostly clear.`;
                direction = "Move Forward";
            }
        } else {
            // FAR — informational
            guidance = `${threatClass} detected on your ${threatPos}, far away. Path is clear.`;
            direction = "Move Forward";
        }

        // 6. Multi-object awareness (mention 2nd object if also threatening)
        if (enriched.length > 1 && enriched[1].dist.level >= 2) {
            const second = enriched[1];
            guidance += ` Also ${second.class} on your ${second.position}.`;
        }

        // 7. Update State
        const finalResults = {
            guidance,
            objects: objectList,
            hazards,
            distance,
            direction
        };
        setResults(finalResults);

        // 8. Voice Announcement (every 3s or on change)
        const now = Date.now();
        const voiceMsg = `${guidance}. ${direction}.`;
        if (status === "running" && (voiceMsg !== lastSpokenRef.current || now - lastAnnouncementTime.current > 3000)) {
            lastSpokenRef.current = voiceMsg;
            lastAnnouncementTime.current = now;
            speak(voiceMsg);
        }
    };

    // --- Controls ---
    async function startAgent() {
        if (!modelRef.current) return;
        setStatus("starting-camera");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: 640, height: 480 }
            });
            videoRef.current.srcObject = stream;
            await new Promise(r => videoRef.current.onloadedmetadata = r);
            videoRef.current.play();
            setStatus("running");
        } catch (err) {
            setError("Camera error: " + err.message);
            setStatus("error");
        }
    }

    function stopAgent() {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        cancelAnimationFrame(requestRef.current);
        setStatus("idle");
        setResults({ guidance: "Engine Idle", objects: [], hazards: "None", distance: "N/A", direction: "N/A" });
    }

    useEffect(() => {
        if (status === "running") {
            requestRef.current = requestAnimationFrame(detectFrame);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [status]);

    useEffect(() => {
        return () => stopAgent();
    }, []);

    const getStatusStyles = () => {
        if (results.direction === "Stop") return { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", text: "#ef4444" };
        if (results.distance === "Clear") return { bg: "rgba(34, 197, 94, 0.15)", border: "#22c55e", text: "#22c55e" };
        if (results.direction === "Move Forward") return { bg: "rgba(34, 197, 94, 0.15)", border: "#22c55e", text: "#22c55e" };
        if (results.direction === "Slow Down") return { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", text: "#f59e0b" };
        return { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", text: "#f59e0b" };
    };

    return (
        <Layout>
            <div style={{ maxWidth: 'var(--container-max)', margin: '4rem auto', padding: '0 1.5rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <div className="section-label" style={{ marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.2em', color: '#a855f7' }}>EDGE VISION ENGINE V3</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <h1 style={{ fontSize: '3.5rem', fontWeight: '950', letterSpacing: '-0.04em', lineHeight: '1.1', margin: 0 }}>
                                    Smart <span className="text-gradient">Vision</span>
                                </h1>
                                <FeatureGuide
                                    title="Smart Vision"
                                    steps={[
                                        { title: 'Activate the Camera', description: 'Press "Activate Vision Agent" to start your camera. On mobile, the rear camera is used automatically for navigation assistance.' },
                                        { title: 'Directional Guidance', description: 'The AI tells you where objects are: "on your left", "on your right", "directly ahead", or "far left/right". Voice announces directions automatically.' },
                                        { title: 'Distance Estimation', description: 'Objects are classified by distance: Very Close (<1m), Close (1-2m), Moderate (2-4m), Nearby (4-6m), or Far (>6m) based on their size in frame.' },
                                        { title: 'Voice Alerts', description: 'The system speaks guidance every 3 seconds. Toggle voice on/off with the Voice button. Critical hazards trigger urgent "Stop" warnings.' },
                                        { title: 'Scene Panel', description: 'The right panel shows: System Guidance (what to do), Proximity (distance), Hazards (dangerous objects), and a list of all detected objects.' },
                                    ]}
                                />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px' }}>
                                Real-time spatial analysis powered by local edge AI. Unlimited use, zero latency, 100% private.
                            </p>
                        </div>
                        {status === "running" && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.6rem 1.2rem', borderRadius: '100px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <div className="pulsing-dot" style={{ backgroundColor: '#22c55e' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#22c55e', letterSpacing: '0.05em' }}>LIVE ENGINE</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
                    {/* Viewport Column */}
                    <div style={{ flex: 1.5 }}>
                        <div className="card" style={{ padding: '0.5rem', background: '#020617', borderRadius: '32px', position: 'relative', overflow: 'hidden', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            {status === "loading-model" ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <div className="spinning" style={{ width: '40px', height: '40px', border: '3px solid #a855f7', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1.5rem' }} />
                                    <p style={{ fontWeight: '800', letterSpacing: '0.05em' }}>WAKING AI ENGINE...</p>
                                </div>
                            ) : status === "idle" || status === "error" ? (
                                <div style={{ textAlign: 'center', color: '#fff', zIndex: 10, padding: '2rem' }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '2rem', filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))' }}>👁️</div>
                                    <button
                                        onClick={startAgent}
                                        className="btn-primary"
                                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '100px', cursor: 'pointer', border: 'none', fontWeight: '900', background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
                                    >
                                        Activate Vision Agent
                                    </button>
                                    {error && <p style={{ color: '#ef4444', marginTop: '1.5rem', fontWeight: '900', fontSize: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>{error}</p>}
                                </div>
                            ) : (
                                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', display: 'block', borderRadius: '24px' }} />
                                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20 }} />
                                    {results.distance.includes("Very Close") && (
                                        <div style={{ position: 'absolute', inset: 0, border: '8px inset #ef4444', borderRadius: '24px', pointerEvents: 'none', zIndex: 25, animation: 'flash 0.5s infinite alternate' }} />
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            {status === "running" && (
                                <button onClick={stopAgent} style={{ background: '#ef4444', color: '#fff', flex: 1, padding: '1.2rem', fontWeight: '900', borderRadius: '100px', fontSize: '1rem', cursor: 'pointer', border: 'none', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.3)' }}>
                                    Deactivate
                                </button>
                            )}
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                style={{ flex: 1, padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '100px', fontSize: '1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: '900' }}
                            >
                                {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
                            </button>
                        </div>
                    </div>

                    {/* Info Column */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Live guidance status card */}
                        <div className="card" style={{ 
                            padding: '2rem', 
                            backgroundColor: getStatusStyles().bg, 
                            border: `2px solid ${getStatusStyles().border}`,
                            borderRadius: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            boxShadow: `0 20px 40px ${getStatusStyles().bg}`
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: '950', letterSpacing: '0.2em', color: getStatusStyles().text }}>SYSTEM GUIDANCE</h3>
                                <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))' }}>
                                    {results.direction.includes("Forward") ? '⬆️' : results.direction.includes("Left") ? '⬅️' : results.direction.includes("Right") ? '➡️' : results.direction.includes("Stop") ? '🛑' : results.direction.includes("Slow") ? '⚠️' : '🔎'}
                                </div>
                             </div>
                            <p style={{
                                color: getStatusStyles().text,
                                fontSize: '1.8rem', lineHeight: '1.2', fontWeight: '950', margin: 0, letterSpacing: '-0.02em'
                            }}>
                                {results.guidance}
                            </p>
                            <div style={{ fontSize: '1rem', fontWeight: '900', color: getStatusStyles().text, opacity: 0.8, letterSpacing: '0.05em' }}>
                                {results.direction.toUpperCase()}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '2rem', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: '950', letterSpacing: '0.2em', color: '#64748b' }}>SCENE ANALYSIS</h3>
                                <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#a855f7' }}>{results.objects.length} OBJECTS</span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📏</span>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>PROXIMITY</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '900', color: '#fff' }}>{results.distance}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>HAZARDS</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '900', color: results.hazards !== 'None' ? '#ef4444' : '#22c55e' }}>{results.hazards.toUpperCase()}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem' }}>
                                {results.objects.map((obj, i) => (
                                    <span key={i} style={{ padding: '0.5rem 1rem', background: '#a855f7', color: '#fff', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.05em' }}>
                                        {obj.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes flash {
                    from { opacity: 0.4; }
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
                    background: linear-gradient(135deg, #a855f7, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .pulsing-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    animation: pulse-dot 1.5s infinite ease-in-out;
                }
                @keyframes pulse-dot {
                    0% { transform: scale(0.9); opacity: 0.7; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.9); opacity: 0.7; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
                .card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    transition: transform 0.3s ease, border-color 0.3s ease;
                }
                .card:hover {
                    border-color: rgba(168, 85, 247, 0.3);
                }
            `}</style>
        </Layout>
    );
};

export default ObjectDetection;
