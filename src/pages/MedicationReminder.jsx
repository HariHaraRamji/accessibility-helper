import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import FeatureGuide from '../components/FeatureGuide';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const MedicationReminder = () => {
    const [medicines, setMedicines] = useState(() => {
        try {
            const saved = localStorage.getItem('medicines');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [form, setForm] = useState({ name: '', dosage: '', time: '08:00', days: [], color: COLORS[0], notes: '' });
    const [activeAlert, setActiveAlert] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [snoozeCounts, setSnoozeCounts] = useState(() => {
        try {
            const saved = localStorage.getItem('snoozeCounts');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });
    const snoozeTimerRef = useRef(null);

    // Persist snooze counts
    useEffect(() => {
        localStorage.setItem('snoozeCounts', JSON.stringify(snoozeCounts));
    }, [snoozeCounts]);

    // Step 4: Request notification permission on load
    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('medicines', JSON.stringify(medicines));
    }, [medicines]);

    // Clock update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Step 2 & 3: Reminder Logic
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];
            const todayString = now.toDateString();

            medicines.forEach(med => {
                const [medHour, medMinute] = med.time.split(":").map(Number);
                const timeMatches = currentHour === medHour && currentMinute === medMinute;
                const dayMatches = med.days.length === 0 || med.days.includes(currentDay);
                const notTakenToday = med.takenDate !== todayString;

                if (timeMatches && dayMatches && notTakenToday) {
                    triggerReminder(med);
                }
            });
        };

        const interval = setInterval(checkReminders, 30000);
        checkReminders();
        return () => clearInterval(interval);
    }, [medicines]);

    const triggerReminder = (medicine) => {
        setActiveAlert(medicine);

        // Voice announcement
        window.speechSynthesis.cancel();
        const snoozeNum = snoozeCounts[medicine.id] || 0;
        const snoozeMsg = snoozeNum > 0 ? `. This is reminder number ${snoozeNum + 1}.` : '';
        const text = `Medicine reminder. Time to take ${medicine.name}. Dosage: ${medicine.dosage}. ${medicine.notes}${snoozeMsg}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);

        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
        }

        // Browser notification
        if (Notification.permission === "granted") {
            new Notification(`💊 ${medicine.name} Reminder${snoozeNum > 0 ? ` (×${snoozeNum + 1})` : ''}`, {
                body: `${medicine.dosage} — ${medicine.notes}`,
                icon: "/favicon.ico"
            });
        }

        // Auto dismiss after 20 seconds
        setTimeout(() => setActiveAlert(null), 20000);
    };

    const snoozeReminder = (medicine) => {
        // Increment snooze count
        setSnoozeCounts(prev => ({
            ...prev,
            [medicine.id]: (prev[medicine.id] || 0) + 1
        }));
        setActiveAlert(null);

        // Voice feedback
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Snoozed. I'll remind you about ${medicine.name} in 5 minutes.`);
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);

        // Re-trigger after 5 minutes
        if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
        snoozeTimerRef.current = setTimeout(() => {
            triggerReminder(medicine);
        }, 5 * 60 * 1000); // 5 minutes
    };

    // Step 5: Reset "taken" status at midnight
    useEffect(() => {
        const resetAtMidnight = () => {
            const now = new Date();
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const msUntilMidnight = midnight.getTime() - now.getTime();

            setTimeout(() => {
                setMedicines(prev => prev.map(m => ({ ...m, taken: false, takenDate: null })));
                resetAtMidnight();
            }, msUntilMidnight);
        };
        resetAtMidnight();
    }, []);

    const handleAddMed = (e) => {
        e.preventDefault();
        if (!form.name) return;
        const newMed = {
            ...form,
            id: Date.now(),
            taken: false,
            takenDate: null
        };
        setMedicines([...medicines, newMed]);
        setForm({ name: '', dosage: '', time: '08:00', days: [], color: COLORS[0], notes: '' });
    };

    const toggleDay = (day) => {
        setForm(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
        }));
    };

    const markTaken = (id) => {
        const todayString = new Date().toDateString();
        setMedicines(prev => prev.map(m =>
            m.id === id ? { ...m, taken: true, takenDate: todayString } : m
        ));
    };

    const deleteMed = (id) => {
        setMedicines(medicines.filter(m => m.id !== id));
    };

    const isDue = (medicine) => {
        const now = new Date();
        const [h, m] = medicine.time.split(":").map(Number);
        const medMinutes = h * 60 + m;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const diff = medMinutes - nowMinutes;
        const todayString = now.toDateString();
        const notTakenToday = medicine.takenDate !== todayString;
        return diff >= 0 && diff <= 30 && notTakenToday;
    };

    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <Layout>
            {/* Notification Banner with Snooze */}
            {activeAlert && (
                <div style={{
                    position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 3000, background: 'var(--bg-card)', border: `2px solid ${activeAlert.color}`,
                    borderRadius: '20px', padding: '1.5rem 1.8rem', minWidth: '360px', maxWidth: '440px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'slideDown 0.4s ease-out',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💊</div>
                    <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                        {activeAlert.name} ({activeAlert.dosage})
                    </div>
                    {(snoozeCounts[activeAlert.id] || 0) > 0 && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.3rem 0.8rem', borderRadius: '50px',
                            background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                            fontSize: '0.75rem', fontWeight: '900', marginBottom: '0.5rem',
                        }}>
                            🔔 Reminded {snoozeCounts[activeAlert.id] + 1} times
                        </div>
                    )}
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                        {activeAlert.notes || 'Time to take your medication.'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => snoozeReminder(activeAlert)}
                            style={{
                                padding: '0.65rem 1.2rem', fontSize: '0.85rem', borderRadius: '50px',
                                background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontWeight: '800', cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            ⏰ Snooze 5 min
                        </button>
                        <button
                            onClick={() => setActiveAlert(null)}
                            className="btn btn-secondary"
                            style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem', borderRadius: '50px' }}
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={() => { markTaken(activeAlert.id); setSnoozeCounts(prev => { const n = {...prev}; delete n[activeAlert.id]; return n; }); setActiveAlert(null); }}
                            className="btn btn-primary"
                            style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem', borderRadius: '50px' }}
                        >
                            ✓ Mark Taken
                        </button>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 1.5rem' }}>
                <header style={{ marginBottom: '2rem', position: 'relative' }}>
                    <div className="section-label" style={{ marginBottom: '0.75rem', fontSize: '0.7rem' }}>Health Monitoring</div>
                    <div style={{ display: 'flex', flexDirection: 'column', md: 'row', justifyContent: 'space-between', alignItems: 'flex-start', md: 'flex-end', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '2rem', md: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                                    Medical <span className="text-gradient">Companion</span>
                                </h1>
                                <FeatureGuide
                                    title="Medical Companion"
                                    steps={[
                                        { title: 'Add a Medicine', description: 'Fill in the medicine name, dosage, time, and repeat days in the form on the right. Pick a color tag for quick identification.' },
                                        { title: 'Set Reminder Time', description: 'Choose the exact time (24-hour format) when you need to take the medicine. Select which days of the week to repeat.' },
                                        { title: 'Get Notified', description: 'When it\'s time, you\'ll get a voice alert, browser notification, and vibration. The notification pops up at the top of the screen.' },
                                        { title: 'Snooze or Take', description: 'If you\'re not ready, press "Snooze 5 min" to be reminded again in 5 minutes. The snooze count tracks how many times you\'ve been reminded.' },
                                        { title: 'Mark as Taken', description: 'Press "Mark Taken" to log that you\'ve taken your dose. The status resets automatically at midnight each day.' },
                                    ]}
                                />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                Accurate reminder engine with 24-hour sync.
                            </p>
                        </div>
                        <div style={{
                            background: 'var(--bg-card)', padding: '0.75rem 1.2rem', borderRadius: '12px',
                            border: '1px solid var(--border-subtle)', textAlign: 'right', transition: 'all 0.3s ease',
                            width: 'fit-content'
                        }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>CURRENT TIME</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'monospace' }}>
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                    <div style={{ flex: 1.2, width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {medicines.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>💊</div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.75rem' }}>No medication scheduled</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add your medications to enable the reminder engine.</p>
                            </div>
                        ) : (
                            medicines.map(med => (
                                <div key={med.id} className="card" style={{
                                    padding: 'var(--card-padding)', borderLeft: `6px solid ${med.color}`,
                                    boxShadow: 'var(--shadow-subtle)', background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: med.color }} />
                                            <div>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{med.name}</h3>
                                                <div style={{ color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.9rem' }}>
                                                    {med.dosage} • Reminder: {formatTime(med.time)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {(snoozeCounts[med.id] || 0) > 0 && (
                                                <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', padding: '0.3rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    🔔 ×{snoozeCounts[med.id]}
                                                </span>
                                            )}
                                            {isDue(med) && <span style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', padding: '0.3rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '900' }}>DUE!</span>}
                                            {med.takenDate === new Date().toDateString() && <span style={{ background: 'var(--success-subtle)', color: 'var(--success)', padding: '0.3rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '900' }}>TAKEN</span>}
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--bg-card-inner)', borderRadius: '12px', padding: '1rem', marginBottom: '1.2rem', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.3rem' }}>NEXT REMINDER</div>
                                        <p style={{ fontWeight: '700', margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            {med.days.length === 0 || med.days.length === 7 ? 'Every Day' : med.days.join(', ')} at {formatTime(med.time)}
                                        </p>
                                        {med.notes && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Note: {med.notes}</p>}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {/* Test Reminder Now - Step 7 */}
                                        <button
                                            onClick={() => triggerReminder(med)}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, padding: '0.8rem', minHeight: '44px', fontSize: '0.85rem', borderRadius: '50px' }}
                                            title="Test Reminder Now"
                                        >
                                            🔔 Test
                                        </button>
                                        <button
                                            onClick={() => markTaken(med.id)}
                                            className="btn btn-primary"
                                            style={{
                                                flex: 2, padding: '0.8rem', minHeight: '44px', fontSize: '0.85rem', borderRadius: '50px',
                                                background: med.takenDate === new Date().toDateString() ? 'var(--success)' : 'var(--accent-gradient)'
                                            }}
                                            disabled={med.takenDate === new Date().toDateString()}
                                        >
                                            {med.takenDate === new Date().toDateString() ? '✓ Taken' : 'Mark Taken'}
                                        </button>
                                        <button
                                            onClick={() => deleteMed(med.id)}
                                            style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', border: 'none', padding: '0.7rem 1rem', minHeight: '44px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '0.9rem' }}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="card" style={{ flex: 1, width: '100%', height: 'fit-content', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease', padding: 'var(--card-padding)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.2rem', color: 'var(--text-primary)' }}>Add Medicine</h3>
                        <form onSubmit={handleAddMed} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>MEDICINE NAME</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol" required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-inner)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                            </div>
                            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-3">
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>DOSAGE</label>
                                    <input type="text" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder="500mg" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-inner)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>TIME (24HR)</label>
                                    <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-inner)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>REPEAT DAYS</label>
                                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    <button type="button" onClick={() => setForm({ ...form, days: DAYS })} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.65rem', borderRadius: '50px' }}>All</button>
                                    <button type="button" onClick={() => setForm({ ...form, days: [] })} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.65rem', borderRadius: '50px' }}>Clear</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {DAYS.map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => toggleDay(d)}
                                            style={{
                                                padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                                                background: form.days.includes(d) ? 'var(--accent-primary)' : 'var(--bg-card-inner)',
                                                border: '1px solid var(--border-subtle)', color: form.days.includes(d) ? '#fff' : 'var(--text-primary)',
                                                fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>COLOR TAG</label>
                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    {COLORS.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => setForm({ ...form, color: c })}
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '50%', background: c,
                                                cursor: 'pointer', border: form.color === c ? '2px solid var(--text-primary)' : '1px solid transparent',
                                                transform: form.color === c ? 'scale(1.15)' : 'none', transition: '0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>NOTES</label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Take with food..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-inner)', color: 'var(--text-primary)', minHeight: '60px', resize: 'none', fontSize: '0.9rem' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', minHeight: '48px', fontSize: '0.95rem', borderRadius: '50px' }}>
                                Add Medicine
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </Layout>
    );
};

export default MedicationReminder;

