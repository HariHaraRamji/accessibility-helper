import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
    const { isDarkMode, isAccessibilityMode, toggleDarkMode, toggleAccessibilityMode } = useTheme();
    const location = useLocation();

    const navLinks = [
        { name: 'Dashboard', path: '/' },
        { name: 'Narrator', path: '/tts' },
        { name: 'Dictation', path: '/stt' },
        { name: 'Vision AI', path: '/detection' },
        { name: 'Acoustic', path: '/sound' },
        { name: 'Meds', path: '/medicine' },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
            {/* Clean White Header */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                height: '80px',
                background: '#ffffff',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 4rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4rem' }}>
                    <Link to="/" style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontFamily: 'var(--font-heading)'
                    }}>
                        <div style={{
                            width: '32px', height: '32px',
                            background: 'var(--accent-gradient)',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '1rem'
                        }}>⭐</div>
                        <span style={{ letterSpacing: '-0.02em' }}>Access<span style={{ color: 'var(--accent-primary)' }}>Helper</span></span>
                    </Link>

                    <div style={{ display: 'flex', gap: '2.5rem' }}>
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    textDecoration: 'none',
                                    color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    fontWeight: location.pathname === link.path ? '700' : '500',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                {link.name}
                                {location.pathname === link.path && (
                                    <div style={{
                                        position: 'absolute', bottom: '-29px', left: '0',
                                        width: '100%', height: '3px',
                                        background: 'var(--accent-primary)',
                                        borderRadius: '2px 2px 0 0'
                                    }} />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={toggleAccessibilityMode}
                        className="btn btn-secondary"
                        style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem', borderRadius: '50px' }}
                    >
                        {isAccessibilityMode ? '👁️ Standard' : '👁️ Access Mode'}
                    </button>
                    <button
                        onClick={toggleDarkMode}
                        style={{
                            padding: '0.6rem 1.4rem', border: '1px solid var(--border-light)',
                            borderRadius: '50px', fontSize: '0.9rem', background: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            fontWeight: '700', color: '#1e293b'
                        }}
                    >
                        {isDarkMode ? "☀️ Light" : "🌙 Dark"}
                    </button>

                </div>
            </nav>

            <main className="container" style={{
                flex: 1,
                paddingTop: '8rem',
                paddingBottom: '5rem'
            }}>
                {children}
            </main>

            <footer style={{
                padding: '5rem 0',
                borderTop: '1px solid var(--border-light)',
                backgroundColor: '#fcfcfe'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                            AccessHelper AI
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Defining the future of independence through accessible technology.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '1.5rem' }}>
                        <span>🧠</span>
                        <span>🚀</span>
                        <span>💖</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
