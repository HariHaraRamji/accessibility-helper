import React, { useRef, useEffect, useState } from 'react';
import Layout from '../components/Layout';

const ObjectDetection = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const modelRef = useRef(null);
    const frameRef = useRef(null);
    const spokenRef = useRef({});

    const [status, setStatus] = useState("idle"); // idle, loading, running, error
    const [error, setError] = useState("");
    const [detectedObjects, setDetectedObjects] = useState([]);
    const [scene, setScene] = useState("");
    const [warnings, setWarnings] = useState([]);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    // Step 1 - Load TensorFlow + COCO-SSD via script injection
    function loadModels() {
        return new Promise((resolve, reject) => {
            if (window.cocoSsd && modelRef.current) {
                resolve();
                return;
            }

            const tf = document.createElement("script");
            tf.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js";
            tf.onload = () => {
                const coco = document.createElement("script");
                coco.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
                coco.onload = () => {
                    window.cocoSsd.load()
                        .then(model => {
                            modelRef.current = model;
                            resolve();
                        })
                        .catch(reject);
                }
                coco.onerror = () => reject(new Error("COCO-SSD failed"));
                document.head.appendChild(coco);
            }
            tf.onerror = () => reject(new Error("TensorFlow failed"));
            document.head.appendChild(tf);
        });
    }

    // Step 2 - Start camera AFTER model loads
    async function startVisionAgent() {
        setStatus("loading");
        setError("");

        try {
            await loadModels();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: 640, height: 480 }
            });

            if (!videoRef.current) return;
            videoRef.current.srcObject = stream;

            await new Promise((resolve) => {
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    resolve();
                }
            });

            setStatus("running");
            runDetection();

        } catch (err) {
            if (err.name === "NotAllowedError") {
                setError("Camera permission denied. Click the camera icon in your browser address bar and allow access.");
            } else {
                setError("Error: " + err.message);
            }
            setStatus("error");
        }
    }

    // Step 3 - Detection loop
    async function runDetection() {
        if (!videoRef.current || !canvasRef.current || !modelRef.current) return;

        if (videoRef.current.readyState === 4) {
            try {
                const predictions = await modelRef.current.detect(videoRef.current);
                const confident = predictions.filter(p => p.score > 0.45);

                drawBoxes(confident);
                setDetectedObjects(confident);
                updateScene(confident);
                announceObjects(confident);
                checkObstacles(confident);

            } catch (e) {
                console.error("Detection error:", e);
            }
        }

        frameRef.current = requestAnimationFrame(runDetection);
    }

    // Step 4 - Draw boxes on canvas
    function drawBoxes(predictions) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const OBSTACLE_LIST = ["person", "chair", "dining table", "car", "motorcycle", "bicycle", "dog", "cat", "couch", "bed", "toilet", "tv"];

        predictions.forEach(pred => {
            const [x, y, w, h] = pred.bbox;
            const isObstacle = OBSTACLE_LIST.includes(pred.class);
            const boxColor = isObstacle ? "#ef4444" : "#7c3aed";

            // Draw box
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            // Draw label background
            const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
            const labelWidth = label.length * 9 + 16;
            ctx.fillStyle = boxColor;
            ctx.fillRect(x, y - 30, labelWidth, 30);

            // Draw label text
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px DM Sans, sans-serif";
            ctx.fillText(label, x + 8, y - 10);
        });
    }

    // Step 5 - Scene description
    function updateScene(predictions) {
        if (!predictions.length) {
            setScene("No objects detected. The area appears clear and safe.");
            return;
        }
        const names = [...new Set(predictions.map(p => p.class))];
        const count = predictions.length;
        let desc = `I can see ${count} object${count > 1 ? "s" : ""}: ${names.join(", ")}. `;
        if (names.includes("person")) desc += "There is a person nearby. ";
        const obstacles = names.filter(n => ["person", "chair", "car", "table", "couch", "bed", "dog", "cat"].includes(n));
        if (obstacles.length) desc += `Be careful of: ${obstacles.join(", ")}.`;
        setScene(desc);
    }

    // Step 6 - Voice announcements with position
    function announceObjects(predictions) {
        if (!voiceEnabled) return;
        const now = Date.now();
        const vw = videoRef.current?.videoWidth || 640;

        predictions.forEach(pred => {
            const key = pred.class;
            if (!spokenRef.current[key] || now - spokenRef.current[key] > 5000) {
                spokenRef.current[key] = now;
                const cx = pred.bbox[0] + pred.bbox[2] / 2;
                const position = cx < vw * 0.33 ? "on your left" : cx > vw * 0.66 ? "on your right" : "in front of you";
                const utterance = new SpeechSynthesisUtterance(`${pred.class} detected ${position}`);
                window.speechSynthesis.speak(utterance);
            }
        });
    }

    // Step 7 - Obstacle warning
    function checkObstacles(predictions) {
        const vw = videoRef.current?.videoWidth || 640;
        const vh = videoRef.current?.videoHeight || 480;
        const frameArea = vw * vh
        const OBSTACLE_LIST = ["person", "chair", "dining table", "car", "motorcycle", "bicycle", "dog", "cat"];

        const closeObstacles = predictions.filter(p => {
            const objArea = p.bbox[2] * p.bbox[3];
            return (objArea / frameArea) > 0.12 && OBSTACLE_LIST.includes(p.class);
        });

        setWarnings(closeObstacles.map(p => {
            const cx = p.bbox[0] + p.bbox[2] / 2;
            const pos = cx < vw * 0.33 ? "on your left" : cx > vw * 0.66 ? "on your right" : "in front of you";
            return { label: p.class, position: pos };
        }));
    }

    // Step 8 - Stop function
    function stopVisionAgent() {
        cancelAnimationFrame(frameRef.current);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        window.speechSynthesis.cancel();
        setStatus("idle");
        setDetectedObjects([]);
        setScene("");
        setWarnings([]);
    }

    useEffect(() => {
        return () => {
            cancelAnimationFrame(frameRef.current);
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
            window.speechSynthesis.cancel();
        }
    }, []);

    const readFullScene = () => {
        const utterance = new SpeechSynthesisUtterance(scene);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                <header style={{ marginBottom: '4rem' }}>
                    <div className="section-label">Spatial Intelligence</div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                        Smart <span className="text-gradient">Vision</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                        Real-time AI environment mapping and obstacle awareness.
                    </p>
                </header>

                {warnings.length > 0 && (
                    <div style={{
                        background: '#ef4444', color: '#fff', padding: '1.5rem',
                        textAlign: 'center', fontWeight: '900', fontSize: '1.5rem',
                        borderRadius: '20px', marginBottom: '3rem',
                        boxShadow: '0 15px 40px rgba(239, 68, 68, 0.3)',
                        animation: 'flash 0.5s infinite alternate'
                    }}>
                        ⚠️ OBSTACLE DETECTED: {warnings[0].label.toUpperCase()} {warnings[0].position.toUpperCase()}
                    </div>
                )}

                <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '3rem' }}>
                    {/* Viewport Column */}
                    <div>
                        <div className="card" style={{ padding: '0.8rem', background: '#000', borderRadius: '24px', position: 'relative', overflow: 'hidden', minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {status === "idle" || status === "loading" ? (
                                <div style={{ textAlign: 'center', color: '#fff' }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>👁️</div>
                                    <button
                                        onClick={startVisionAgent}
                                        className="btn btn-primary"
                                        disabled={status === "loading"}
                                        style={{ padding: '1.5rem 3rem', fontSize: '1.1rem' }}
                                    >
                                        {status === "loading" ? "Initializing AI..." : "Activate Vision Agent"}
                                    </button>
                                    {error && <p style={{ color: '#ef4444', marginTop: '1.5rem', fontWeight: '800' }}>{error}</p>}
                                </div>
                            ) : (
                                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                    <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", borderRadius: '16px' }} />
                                    <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            {status === "running" && (
                                <button onClick={stopVisionAgent} className="btn" style={{ background: '#ef4444', color: '#fff', flex: 1, padding: '1.2rem', fontWeight: '800' }}>
                                    Stop Agent
                                </button>
                            )}
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                            >
                                {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Info Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ padding: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '0.05em' }}>SCENE NARRATOR</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                                {scene || "Vision agent is waiting to analyze the surroundings."}
                            </p>
                            <button onClick={readFullScene} className="btn btn-secondary" style={{ width: '100%' }} disabled={!scene}>
                                📢 Read Full Scene
                            </button>
                        </div>

                        <div className="card" style={{ padding: '2.5rem', flex: 1 }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '2rem', fontWeight: '900', letterSpacing: '0.05em' }}>DETECTION MATCHES</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                {detectedObjects.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>Scanning area...</p>
                                ) : (
                                    detectedObjects.map((obj, i) => (
                                        <div key={i} style={{
                                            padding: '0.8rem 1.2rem', background: '#f8f9ff', borderRadius: '12px',
                                            border: '1px solid var(--border-light)', fontSize: '0.9rem', fontWeight: '700'
                                        }}>
                                            <span style={{ color: 'var(--accent-primary)', marginRight: '0.5rem' }}>#</span>
                                            {obj.class} <span style={{ opacity: 0.5, marginLeft: '0.4rem' }}>{Math.round(obj.score * 100)}%</span>
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
                    from { opacity: 0.8; transform: scale(1); }
                    to { opacity: 1; transform: scale(1.01); }
                }
                .text-gradient {
                    background: var(--accent-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </Layout>
    );
};

export default ObjectDetection;
