import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Home = () => {
    const features = [
        {
            title: 'Neural Narrator',
            path: '/tts',
            icon: '🔊',
            color: 'var(--accent-primary)',
            desc: 'High-fidelity AI voice synthesis with human-like prosody and emotion.'
        },
        {
            title: 'Smart Dictation',
            path: '/stt',
            icon: '🎙️',
            color: 'var(--accent-secondary)',
            desc: 'State-of-the-art neural transcription for lectures, notes, and meetings.'
        },
        {
            title: 'Vision Intelligence',
            path: '/detection',
            icon: '👁️',
            color: 'var(--success)',
            desc: 'Real-time spatial awareness using deep learning for independent navigation.'
        },
        {
            title: 'Acoustic Alerts',
            path: '/sound',
            icon: '👂',
            color: 'var(--warning)',
            desc: 'Real-time sound classification to perceive critical environmental audio cues.'
        },
        {
            title: 'Health Reminders',
            path: '/medicine',
            icon: '💊',
            color: '#ec4899',
            desc: 'Scheduled multi-sensory health alerts with persistent tracking and notes.'
        },
    ];

    return (
        <Layout>
            <div style={{ textAlign: 'left', marginBottom: '8rem', marginTop: '2rem' }}>
                <div className="section-label">
                    Empowering Independence
                </div>

                <h1 style={{ fontSize: '5.5rem', lineHeight: '1', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-0.03em' }}>
                    The Next Evolution of <br />
                    <span className="text-gradient">Accessible Intelligence</span>
                </h1>

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1.4rem',
                    maxWidth: '850px',
                    fontWeight: '400',
                    lineHeight: '1.6'
                }}>
                    A comprehensive suite of cognitive assistive tools designed to help you navigate,
                    communicate, and live with total confidence.
                </p>
            </div>

            <div className="grid">
                {features.map((feature, index) => (
                    <Link
                        key={feature.path}
                        to={feature.path}
                        className="card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2.5rem',
                            padding: '3.5rem',
                            textDecoration: 'none',
                            color: 'inherit'
                        }}
                    >
                        <div style={{
                            fontSize: '2.8rem',
                            background: '#ffffff',
                            width: '80px',
                            height: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '20px',
                            border: `2px solid ${feature.color}15`,
                            boxShadow: `0 8px 20px ${feature.color}08`
                        }}>
                            {feature.icon}
                        </div>

                        <div>
                            <h3 style={{ fontSize: '2.2rem', marginBottom: '1.2rem', color: 'var(--text-primary)' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: '1.6' }}>
                                {feature.desc}
                            </p>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            color: 'var(--accent-primary)',
                            fontWeight: '700',
                            fontSize: '1.1rem'
                        }}>
                            Open Feature <span>→</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Premium CTA Banner */}
            <div className="card" style={{
                marginTop: '6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4rem',
                background: '#fcfcfe',
                border: '1px solid var(--border-light)'
            }}>
                <div style={{ maxWidth: '600px' }}>
                    <div className="section-label" style={{ marginBottom: '1.5rem' }}>Enhanced Support</div>
                    <h2 style={{ fontSize: '2.8rem', marginBottom: '1.5rem' }}>Need more clarity?</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: '1.6' }}>
                        Activate <strong>Access Mode</strong> in the navigation bar to enable higher contrast,
                        larger typography, and simplified layouts across the entire application.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🛡️</div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-muted)' }}>SECURE</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🧠</div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-muted)' }}>NEURAL</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⚡</div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-muted)' }}>RAPID</div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Home;
