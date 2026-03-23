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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', transition: 'background-color 0.3s' }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                height: 'var(--navbar-height)',
                background: 'var(--bg-navbar)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'background-color 0.3s, border-color 0.3s'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link to="/" style={{
                        fontSize: '1.15rem',
                        fontWeight: '800',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontFamily: 'var(--font-heading)'
                    }}>
                        <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🧑🏻‍⚕️</span>
                        <span style={{ letterSpacing: '-0.02em' }}>Accessibility<span style={{ color: 'var(--accent-primary)' }}>Assistant  </span></span>
                    </Link>

                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    textDecoration: 'none',
                                    color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    fontWeight: location.pathname === link.path ? '700' : '500',
                                    fontSize: '0.82rem',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                {link.name}
                                {location.pathname === link.path && (
                                    <div style={{
                                        position: 'absolute', bottom: '-17px', left: '0',
                                        width: '100%', height: '3px',
                                        background: 'var(--accent-primary)',
                                        borderRadius: '2px 2px 0 0'
                                    }} />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={toggleDarkMode}
                        style={{
                            padding: '0.35rem 0.85rem', border: '1px solid var(--border-subtle)',
                            borderRadius: '50px', fontSize: '0.78rem', background: 'var(--bg-card-inner)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            fontWeight: '700', color: 'var(--text-primary)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isDarkMode ? "☀️ Sun" : "🌙 Dark"}
                    </button>
                </div>
            </nav>

            <main className="container" style={{
                flex: 1,
                paddingTop: 'calc(var(--navbar-height) + 1.5rem)',
                paddingBottom: '2rem'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
