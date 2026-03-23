import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Home = () => {
    const features = [
        {
            title: 'Neural Narrator',
            path: '/tts',
            icon: '🔊',
            color: 'purple',
            desc: 'High-fidelity AI voice synthesis with human-like prosody and emotion.'
        },
        {
            title: 'Smart Dictation',
            path: '/stt',
            icon: '🎙️',
            color: 'cyan',
            desc: 'State-of-the-art neural transcription for lectures, notes, and meetings.'
        },
        {
            title: 'Vision Intelligence',
            path: '/detection',
            icon: '👁️',
            color: 'green',
            desc: 'Real-time spatial awareness using deep learning for independent navigation.'
        },
        {
            title: 'Acoustic Alerts',
            path: '/sound',
            icon: '👂',
            color: 'amber',
            desc: 'Real-time sound classification to perceive critical environmental audio cues.'
        },
        {
            title: 'Health Reminders',
            path: '/medicine',
            icon: '💊',
            color: 'pink',
            desc: 'Scheduled health alerts with smart medication tracking and reminders.'
        },
    ];

    return (
        <Layout>
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-glow" />

                <div className="section-label" style={{ marginBottom: '1rem' }}>
                    Empowering Independence
                </div>

                <h1 className="hero-heading">
                    The Next Evolution of <br />
                    <span className="text-gradient">Accessibility Interligence</span>
                </h1>
                <span className="hero-underline" />

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    maxWidth: '600px',
                    margin: '1rem auto 0',
                    lineHeight: '1.6'
                }}>
                    AI-powered tools designed for visually and hearing impaired users — navigate, listen, speak, and stay healthy with confidence.
                </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid">
                {features.map((feature) => (
                    <Link
                        key={feature.path}
                        to={feature.path}
                        className="card feature-card"
                        data-color={feature.color}
                    >
                        <div
                            className="feature-icon-box"
                            data-color={feature.color}
                        >
                            {feature.icon}
                        </div>

                        <div style={{ flex: 1 }}>
                            <h3 className="feature-card-title">{feature.title}</h3>
                            <p className="feature-card-desc">{feature.desc}</p>
                        </div>

                        <div className="feature-card-link">
                            Open Feature <span>→</span>
                        </div>
                    </Link>
                ))}
            </div>
        </Layout>
    );
};

export default Home;
