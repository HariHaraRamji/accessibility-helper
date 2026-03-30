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
                        <button
                            onClick={toggleDarkMode}
                            className="material-symbols-outlined text-white hover:bg-blue-800 p-2 rounded-full focus:ring-4 focus:ring-amber-500 outline-none transition-transform hover:scale-110 active:scale-95"
                        >
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </button>
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
        </div>
    );
};

export default Layout;
