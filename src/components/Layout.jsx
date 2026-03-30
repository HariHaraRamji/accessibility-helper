import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
    const { isDarkMode, toggleDarkMode } = useTheme();
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
            <nav className={`${isDarkMode ? 'bg-slate-900' : 'bg-[#1E3A8A]'} shadow-xl border-b-4 border-amber-500 w-full top-0 z-50 sticky`}>
                <div className="flex justify-between items-center w-full px-6 py-4 mx-auto max-w-7xl">
                    <div className="flex items-center gap-8">
                        <Link to="/" className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-white'} font-headline no-underline`}>
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleDarkMode}
                            className="material-symbols-outlined text-white hover:bg-blue-800 p-2 rounded-full focus:ring-4 focus:ring-amber-500 outline-none"
                        >
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </button>
                        <button className="bg-white text-primary font-bold px-4 py-2 rounded-lg hover:bg-blue-50 focus:ring-4 focus:ring-amber-500 outline-none transition-transform active:scale-95">
                            Access Mode
                        </button>
                    </div>
                </div>
            </nav>

            <main className="w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className={`${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'} border-t-2`}>
                <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full max-w-7xl mx-auto gap-8">
                    <div className="flex flex-col gap-4">
                        <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'} font-headline`}>AccessHelper</span>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>© 2024 AccessHelper. All rights reserved.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 font-label text-sm leading-relaxed">
                        <a className={`${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-700'} font-bold underline focus:ring-4 focus:ring-blue-500 outline-none`} href="#">Accessibility Statement</a>
                        <Link className={`${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-700'} underline focus:ring-4 focus:ring-blue-500 outline-none`} to="/privacy">Privacy Policy</Link>
                    </div>
                    <div className="flex gap-4">
                        <button className={`material-symbols-outlined p-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} hover:text-primary transition-colors focus:ring-4 focus:ring-blue-500 outline-none`}>
                            language
                        </button>
                        <button className={`material-symbols-outlined p-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} hover:text-primary transition-colors focus:ring-4 focus:ring-blue-500 outline-none`}>
                            help
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
