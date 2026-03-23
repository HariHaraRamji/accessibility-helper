import React, { useRef, useEffect, useState } from 'react';
import Layout from '../components/Layout';

// --- Helper: Load external script ---
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

const OBSTACLE_LIST = [
    "person", "chair", "car", "table", "dining table", "bicycle", "motorcycle",
    "dog", "cat", "couch", "bed", "truck", "bus",
    "bench", "backpack", "suitcase", "bottle", "umbrella",
    "stop sign", "fire hydrant", "potted plant"
];

const ObjectDetection = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const modelRef = useRef(null);
    const frameRef = useRef(null);
    const spokenRef = useRef({}); // { [class]: { lastTime, count } }
    const detectedObjectsRef = useRef([]); // always-fresh for guidance
    const voiceEnabledRef = useRef(true);   // readable inside callbacks

    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [detectedObjects, setDetectedObjects] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [objectCount, setObjectCount] = useState(0);
    const [lastGuide, setLastGuide] = useState(""); // live guidance text shown in UI

    const playAudio = (text) => {
        if (voiceEnabledRef.current && text) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.85;
            u.pitch = 1;
            window.speechSynthesis.speak(u);
        }
    };

    // Keep voiceEnabledRef in sync with state so setInterval can read it
    useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

    // --- Distance estimation based on bounding box area ---
    function estimateDistance(pred, frameArea) {
        const objArea = pred.bbox[2] * pred.bbox[3];
        const ratio = objArea / frameArea;
        if (ratio > 0.25) return "very close";
        if (ratio > 0.10) return "close";
        return "nearby";
    }

    function getDistanceColor(distance) {
        if (distance === "very close") return "#ef4444";
        if (distance === "close") return "#f59e0b";
        return "#8892b0";
    }

    // ========== COCO-SSD LOCAL DETECTION (UNLIMITED) ==========

    async function startVisionAgent() {
        setStatus("starting-camera");
        setError("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            await new Promise(r => setTimeout(r, 50));
            if (!videoRef.current) throw new Error("Video element missing");

            videoRef.current.srcObject = stream;
            await new Promise(resolve => {
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    resolve();
                };
            });

            setStatus("loading-model");
            await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
            modelRef.current = await window.cocoSsd.load();

            setStatus("running");
            runDetection();
        } catch (err) {
            console.error(err);
            if (err.name === "NotAllowedError" || err.name === "NotFoundError") {
                setError("Camera permission denied. Please allow camera access.");
            } else {
                setError("Error: " + err.message);
            }
            setStatus("error");
        }
    }

    async function runDetection() {
        if (!videoRef.current || !canvasRef.current || !modelRef.current) return;

        if (videoRef.current.readyState === 4) {
            try {
                const predictions = await modelRef.current.detect(videoRef.current);
                const confident = predictions.filter(p => p.score > 0.35);

                const vw = videoRef.current.videoWidth || 640;
                const vh = videoRef.current.videoHeight || 480;
                const frameArea = vw * vh;

                // Enrich predictions with distance and position
                const enriched = confident.map(pred => {
                    const cx = pred.bbox[0] + pred.bbox[2] / 2;
                    const position = cx < vw * 0.33 ? "left" : cx > vw * 0.66 ? "right" : "center";
                    const distance = estimateDistance(pred, frameArea);
                    return { ...pred, position, distance };
                });

                drawBoxes(enriched);
                detectedObjectsRef.current = enriched; // keep ref fresh
                setDetectedObjects(enriched);
                setObjectCount(enriched.length);
                announceObjects(enriched);
                checkObstacles(enriched, frameArea);
            } catch (e) {
                console.error("Detection error:", e);
            }
        }

        // Throttle to ~100ms between frames for CPU efficiency
        frameRef.current = setTimeout(() => {
            requestAnimationFrame(runDetection);
        }, 100);
    }

    function drawBoxes(predictions) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach(pred => {
            const [x, y, w, h] = pred.bbox;
            const isObstacle = OBSTACLE_LIST.includes(pred.class);
            const boxColor = pred.distance === "very close" ? "#ef4444" :
                             pred.distance === "close" ? "#f59e0b" :
                             isObstacle ? "#ef4444" : "#a855f7";

            // Draw glow for very close obstacles
            if (pred.distance === "very close" && isObstacle) {
                ctx.shadowColor = "#ef4444";
                ctx.shadowBlur = 18;
            } else {
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
            }

            ctx.strokeStyle = boxColor;
            ctx.lineWidth = pred.distance === "very close" ? 4 : 3;
            ctx.strokeRect(x, y, w, h);

            // Reset shadow for label
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;

            const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
            const distLabel = pred.distance !== "nearby" ? ` · ${pred.distance}` : "";
            const fullLabel = label + distLabel;
            ctx.font = "bold 14px Inter, sans-serif";
            const textWidth = ctx.measureText(fullLabel).width;

            ctx.fillStyle = boxColor;
            ctx.fillRect(x, Math.max(0, y - 30), textWidth + 16, 30);

            ctx.fillStyle = "#ffffff";
            ctx.fillText(fullLabel, x + 8, Math.max(0, y - 30) + 20);
        });
    }

    // ========== AUTO GUIDANCE (runs every detection cycle) ==========

    // Compute a directional guidance string from current obstacle data
    function computeGuidance(obstacles) {
        if (!obstacles.length) return "";

        const score = (preds) => preds.reduce((s, p) =>
            s + (p.distance === "very close" ? 3 : p.distance === "close" ? 2 : 1), 0);

        const leftScore   = score(obstacles.filter(p => p.position === "left"));
        const centerScore = score(obstacles.filter(p => p.position === "center"));
        const rightScore  = score(obstacles.filter(p => p.position === "right"));
        const names = [...new Set(obstacles.map(p => p.class))].join(" and ");

        if (leftScore > 0 && centerScore === 0 && rightScore === 0)
            return `${names} on your left. Move to the right.`;
        if (rightScore > 0 && centerScore === 0 && leftScore === 0)
            return `${names} on your right. Move to the left.`;
        if (centerScore > 0 && leftScore === 0 && rightScore === 0)
            return `${names} ahead. Stop — do not move forward.`;
        if (centerScore > 0 || (leftScore > 0 && rightScore > 0)) {
            return leftScore <= rightScore
                ? `${names} blocking path. Turn left.`
                : `${names} blocking path. Turn right.`;
        }
        return `Obstacles all around. Please stop.`;
    }

    function announceObjects(predictions) {
        if (!voiceEnabledRef.current) return;
        const now = Date.now();
        const MAX_PLAYS = 3;
        const REPEAT_INTERVAL = 4000;
        const RESET_AFTER = 10000;

        // Group obstacle predictions, compute one guidance message per group
        const obstacles = predictions.filter(p => OBSTACLE_LIST.includes(p.class));
        const nonObstacles = predictions.filter(p => !OBSTACLE_LIST.includes(p.class));

        // --- Speak directional guidance for obstacles ---
        if (obstacles.length) {
            const key = "__guidance__";
            const entry = spokenRef.current[key];
            if (entry && now - entry.lastTime > RESET_AFTER) delete spokenRef.current[key];
            const current = spokenRef.current[key];
            const canAnnounce = !current || (current.count < MAX_PLAYS && now - current.lastTime > REPEAT_INTERVAL);

            if (canAnnounce) {
                const msg = computeGuidance(obstacles);
                spokenRef.current[key] = { lastTime: now, count: current ? current.count + 1 : 1 };
                setLastGuide(msg);
                const u = new SpeechSynthesisUtterance(msg);
                u.rate = 0.9;
                u.pitch = 1;
                window.speechSynthesis.speak(u);
            }
        } else {
            // Reset guidance cooldown when area clears
            delete spokenRef.current["__guidance__"];
            setLastGuide("Path is clear. Move forward safely.");
        }

        // --- Also announce non-obstacle objects (informational only, once) ---
        nonObstacles.forEach(pred => {
            const key = pred.class;
            const entry = spokenRef.current[key];
            if (entry && now - entry.lastTime > RESET_AFTER) delete spokenRef.current[key];
            const current = spokenRef.current[key];
            const canAnnounce = !current || (current.count < MAX_PLAYS && now - current.lastTime > REPEAT_INTERVAL);
            if (canAnnounce) {
                spokenRef.current[key] = { lastTime: now, count: current ? current.count + 1 : 1 };
                const posText = pred.position === "left" ? "on your left" :
                                pred.position === "right" ? "on your right" : "ahead";
                const u = new SpeechSynthesisUtterance(`${pred.class} ${posText}`);
                u.rate = 0.9; u.pitch = 1;
                window.speechSynthesis.speak(u);
            }
        });
    }

    function checkObstacles(predictions, frameArea) {
        const vw = videoRef.current?.videoWidth || 640;

        const closeObstacles = predictions.filter(p => {
            const objArea = p.bbox[2] * p.bbox[3];
            return (objArea / frameArea) > 0.12 && OBSTACLE_LIST.includes(p.class);
        });

        setWarnings(closeObstacles.map(p => {
            const cx = p.bbox[0] + p.bbox[2] / 2;
            const pos = cx < vw * 0.33 ? "on your left" : cx > vw * 0.66 ? "on your right" : "in front of you";
            return { label: p.class, position: pos, distance: p.distance };
        }));
    }

    // ========== STOP & CLEANUP ==========

    function stopVisionAgent() {
        if (frameRef.current) {
            clearTimeout(frameRef.current);
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        window.speechSynthesis.cancel();
        detectedObjectsRef.current = [];
        setStatus("idle");
        setDetectedObjects([]);
        setWarnings([]);
        setObjectCount(0);
        setLastGuide("");
    }

    useEffect(() => {
        return () => {
            if (frameRef.current) {
                clearTimeout(frameRef.current);
                cancelAnimationFrame(frameRef.current);
            }
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    return (
        <Layout>
            <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 1.5rem' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <div className="section-label" style={{ marginBottom: '0.75rem', fontSize: '0.7rem' }}>Spatial Intelligence</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                                Smart <span className="text-gradient">Vision</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                On-device AI detection with enhanced spatial awareness.
                            </p>
                        </div>
                        {status === "running" && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="pulsing-dot" />
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--success, #22c55e)' }}>LIVE</span>
                                {objectCount > 0 && (
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: '800',
                                        background: 'var(--accent-gradient)', color: '#fff',
                                        padding: '0.2rem 0.6rem', borderRadius: '50px',
                                        marginLeft: '0.3rem'
                                    }}>
                                        {objectCount} object{objectCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {warnings.length > 0 && (
                    <div style={{
                        background: 'var(--danger)', color: '#fff', padding: '1rem',
                        textAlign: 'center', fontWeight: '900', fontSize: '1.1rem',
                        borderRadius: '14px', marginBottom: '1.5rem',
                        boxShadow: 'var(--shadow-subtle)',
                        animation: 'flash 0.5s infinite alternate'
                    }}>
                        ⚠️ OBSTACLE: {warnings[0].label.toUpperCase()} {warnings[0].position.toUpperCase()}
                        {warnings[0].distance === "very close" && " — VERY CLOSE!"}
                    </div>
                )}

                <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
                    {/* Viewport Column */}
                    <div>
                        <div className="card" style={{ padding: '0.5rem', background: '#000', borderRadius: '20px', position: 'relative', overflow: 'hidden', minHeight: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
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
                                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                                    {status === "loading-model" && (
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', padding: '1rem 2rem', borderRadius: '50px', color: '#fff', fontWeight: 'bold', zIndex: 20 }}>
                                            Loading AI Model...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem' }}>
                            {(status !== "idle" && status !== "error") && (
                                <button onClick={stopVisionAgent} style={{ background: 'var(--danger)', color: '#fff', flex: 1, padding: '0.8rem', fontWeight: '800', borderRadius: '50px', fontSize: '0.9rem', cursor: 'pointer', border: 'none' }}>
                                    Stop Agent
                                </button>
                            )}
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                style={{ flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', borderRadius: '50px', fontSize: '0.9rem', cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            >
                                {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Info Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Live guidance status card */}
                        <div className="card" style={{ padding: 'var(--card-padding)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '900', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>🧭 LIVE GUIDANCE</h3>
                            <p style={{
                                color: lastGuide.includes('clear') ? 'var(--success, #22c55e)' : '#f59e0b',
                                fontSize: '0.95rem', lineHeight: '1.6', fontWeight: '700'
                            }}>
                                {lastGuide || (status === 'running' ? 'Scanning for obstacles…' : 'Start the agent to enable guidance.')}
                            </p>
                        </div>

                        <div className="card" style={{ padding: 'var(--card-padding)', flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease', minHeight: '200px' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.2rem', fontWeight: '900', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>DETECTION MATCHES</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                {detectedObjects.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', opacity: 0.5, fontSize: '0.9rem' }}>{status === "running" ? "Scanning area..." : "Pending start..."}</p>
                                ) : (
                                    detectedObjects.map((obj, i) => {
                                        const distColor = getDistanceColor(obj.distance);
                                        return (
                                            <div key={i} style={{
                                                padding: '0.5rem 0.8rem', background: 'var(--bg-card-inner)', borderRadius: '10px',
                                                border: `1px solid ${obj.distance === "very close" ? '#ef444440' : obj.distance === "close" ? '#f59e0b30' : 'var(--border-subtle)'}`,
                                                fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                                            }}>
                                                <span style={{ color: 'var(--accent-primary)' }}>#</span>
                                                {obj.class}
                                                <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>{Math.round(obj.score * 100)}%</span>
                                                {obj.distance !== "nearby" && (
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: '800',
                                                        color: distColor,
                                                        background: `${distColor}18`,
                                                        padding: '0.1rem 0.4rem', borderRadius: '50px',
                                                        marginLeft: '0.15rem', textTransform: 'uppercase'
                                                    }}>
                                                        {obj.distance}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes flash {
                    from { opacity: 0.8; transform: scale(1); }
                    to { opacity: 1; transform: scale(1.01); }
                }
                @keyframes slideIn {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
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
