import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0f172a]' : 'bg-background'} text-on-background selection:bg-tertiary-fixed selection:text-on-tertiary-fixed`}>
            {/* TopNavBar Navigation Shell */}
            <nav className={`${isDarkMode ? 'bg-slate-900' : 'bg-[#1E3A8A]'} shadow-xl border-b-4 border-amber-500 w-full top-0 z-50 sticky transition-all duration-300`}>
                <div className="flex justify-between items-center w-full px-4 md:px-6 py-4 mx-auto max-w-7xl">
                    <div className="flex items-center gap-3 md:gap-8">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden material-symbols-outlined text-white p-2 hover:bg-blue-800 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? 'close' : 'menu'}
                        </button>
                        <Link to="/" className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-white'} font-headline no-underline`}>
                            AccessHelper
                        </Link>
                        <div className="hidden md:flex items-center gap-6 font-body text-base font-medium tracking-wide">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`transition-all duration-200 focus:scale-105 focus:ring-4 focus:ring-amber-500 outline-none px-2 py-1 rounded no-underline ${
                                        location.pathname === link.path
                                            ? 'text-white border-b-2 border-white pb-1'
                                            : 'text-blue-100 hover:text-white hover:bg-blue-800'
                                    } ${isDarkMode && location.pathname !== link.path ? 'hover:bg-slate-800' : ''}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <button
                                onClick={toggleDarkMode}
                                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                style={{
                                    position: 'relative',
                                    width: '72px',
                                    height: '36px',
                                    borderRadius: '100px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: isDarkMode
                                        ? 'linear-gradient(135deg, #1e293b, #334155)'
                                        : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    boxShadow: isDarkMode
                                        ? '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.05)'
                                        : '0 2px 12px rgba(245,158,11,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '3px',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Icons positioned on each side */}
                                <span style={{
                                    position: 'absolute',
                                    left: '10px',
                                    fontSize: '14px',
                                    opacity: isDarkMode ? 0.4 : 1,
                                    transition: 'opacity 0.3s ease',
                                    zIndex: 1,
                                    filter: isDarkMode ? 'none' : 'drop-shadow(0 0 3px rgba(255,255,255,0.5))',
                                }}>☀️</span>
                                <span style={{
                                    position: 'absolute',
                                    right: '10px',
                                    fontSize: '14px',
                                    opacity: isDarkMode ? 1 : 0.4,
                                    transition: 'opacity 0.3s ease',
                                    zIndex: 1,
                                    filter: isDarkMode ? 'drop-shadow(0 0 3px rgba(200,200,255,0.4))' : 'none',
                                }}>🌙</span>
                                {/* Slider thumb */}
                                <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: isDarkMode ? '#0f172a' : '#ffffff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                    transform: isDarkMode ? 'translateX(36px)' : 'translateX(0)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: 2,
                                }} />
                            </button>
                            <span style={{
                                fontSize: '0.6rem',
                                fontWeight: '800',
                                color: 'rgba(255,255,255,0.7)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}>
                                {isDarkMode ? 'Dark' : 'Light'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 py-4 border-t border-blue-800' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-2 px-4">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`px-4 py-3 rounded-lg text-lg font-bold no-underline transition-colors ${
                                    location.pathname === link.path
                                        ? 'bg-amber-500 text-primary'
                                        : 'text-blue-100 hover:bg-blue-800'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="w-full">
                {children}
            </main>

            <footer className="bg-footer border-t-4 border-[#F59E0B] py-12 px-4 md:px-6 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <Link to="/" className="text-2xl font-bold text-on-surface font-headline no-underline">
                            AccessHelper
                        </Link>
                        <p className="text-on-surface-variant text-sm max-w-xs text-center md:text-left font-body">
                            Empowering independence through intelligent assistive technology and empathetic design.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex gap-6">
                            <Link to="/privacy" className="text-on-surface-variant hover:text-on-surface transition-colors no-underline text-sm font-medium font-body">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-on-surface-variant hover:text-on-surface transition-colors no-underline text-sm font-medium font-body">
                                Terms and Conditions
                            </Link>
                        </div>
                        <p className="text-on-surface-variant text-xs font-body">
                            © 2026 AccessHelper. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
