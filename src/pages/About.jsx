import React from 'react';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const About = () => {
    const { isDarkMode } = useTheme();

    const features = [
        {
            icon: 'campaign',
            title: 'Neural Narrator (Text-to-Speech)',
            description: 'High-fidelity environmental audio description that transforms visual scenes into immersive spoken narratives. Supports multiple languages and natural-sounding voices powered by AI.',
            color: '#1E3A8A',
            link: '/tts'
        },
        {
            icon: 'mic',
            title: 'Smart Dictation (Speech-to-Text)',
            description: 'Context-aware speech recognition with high accuracy, supporting over 40 languages and dialects. Perfect for hands-free note-taking, messaging, and document creation.',
            color: '#06B6D4',
            link: '/stt'
        },
        {
            icon: 'visibility',
            title: 'Vision Intelligence (Object Detection)',
            description: 'Real-time object and text recognition optimized for low-light environments. Identifies objects, reads signs, and describes surroundings to help users navigate safely.',
            color: '#10B981',
            link: '/detection'
        },
        {
            icon: 'hearing',
            title: 'Acoustic Alerts (Sound Detection)',
            description: 'Visual and haptic feedback for critical environmental sounds like alarms, doorbells, knocks, and emergency sirens. Never miss an important sound again.',
            color: '#F59E0B',
            link: '/sound'
        },
        {
            icon: 'medication',
            title: 'Health Reminders (Medication Tracker)',
            description: 'Scheduled notifications for medication and daily wellness checks. Set custom reminders, track adherence, and maintain your health routine with ease.',
            color: '#DC2626',
            link: '/medicine'
        },
    ];

    return (
        <Layout>
            {/* Hero */}
            <section className={`relative overflow-hidden pt-20 pb-16 px-6 text-center ${isDarkMode ? 'bg-[#0f172a]' : 'bg-surface-container-lowest'}`}>
                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="inline-block px-4 py-1 mb-6 text-sm font-bold tracking-widest text-[#F59E0B] uppercase font-label">
                        ABOUT THE PROJECT
                    </span>
                    <h1 className={`text-4xl md:text-6xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-[#1E3A8A]'} mb-8 leading-[1.1] font-headline`}>
                        AccessHelper
                    </h1>
                    <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-on-surface-variant'} max-w-2xl mx-auto mb-6 leading-relaxed font-body`}>
                        AccessHelper is a revolutionary AI-powered assistive technology platform designed to empower individuals with disabilities. Our mission is to make the world more accessible through intelligent automation, real-time processing, and empathetic design.
                    </p>
                </div>
            </section>

            {/* What AccessHelper Can Do */}
            <section className={`py-20 px-6 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-surface-container-low'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold tracking-widest font-label">CAPABILITIES</span>
                        <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-on-surface'} mt-4 mb-4 font-headline`}>What AccessHelper Can Do</h2>
                        <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-on-surface-variant'}`}>
                            Our suite of AI-powered tools work together to provide comprehensive accessibility support for daily life.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Link
                                key={index}
                                to={feature.link}
                                className={`${isDarkMode ? 'bg-[#0f172a] border-slate-700/30 hover:border-blue-500' : 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary'} p-8 rounded-2xl shadow-sm border-2 transition-all duration-300 group no-underline hover:shadow-xl hover:-translate-y-1`}
                            >
                                <div className="p-4 rounded-xl shadow-lg w-fit mb-6" style={{ backgroundColor: feature.color }}>
                                    <span className="material-symbols-outlined text-3xl text-white">{feature.icon}</span>
                                </div>
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#111827]'} mb-3`}>{feature.title}</h3>
                                <p className={`${isDarkMode ? 'text-slate-400' : 'text-on-surface-variant'} text-sm leading-relaxed mb-6`}>{feature.description}</p>
                                <span className="inline-flex items-center gap-2 text-primary font-extrabold group-hover:translate-x-2 transition-transform">
                                    Try It <span className="material-symbols-outlined">arrow_right_alt</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className={`py-20 px-6 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-surface'}`}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold tracking-widest font-label">HOW IT WORKS</span>
                        <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-on-surface'} mt-4 mb-4 font-headline`}>Built for Real-World Impact</h2>
                    </div>

                    <div className="space-y-8">
                        {[
                            {
                                icon: 'bolt',
                                title: 'Real-Time AI Processing',
                                desc: 'All AI computations happen locally on your device with near-zero latency. No cloud dependency means faster responses and complete privacy.'
                            },
                            {
                                icon: 'security',
                                title: 'Privacy-First Architecture',
                                desc: 'Your data never leaves your device. AccessHelper processes everything on-device, ensuring your personal information stays private and secure at all times.'
                            },
                            {
                                icon: 'battery_full',
                                title: 'Optimized for Mobile',
                                desc: 'Engineered to preserve mobile battery life while maintaining peak performance. Use AccessHelper all day without worrying about power consumption.'
                            },
                            {
                                icon: 'language',
                                title: 'Multi-Language Support',
                                desc: 'Supports over 40 languages and dialects for both speech recognition and text-to-speech, making accessibility truly global.'
                            },
                            {
                                icon: 'accessibility_new',
                                title: 'Universal Design',
                                desc: 'Every interface element is designed with accessibility in mind — high contrast, large touch targets, screen reader compatibility, and keyboard navigation support.'
                            },
                        ].map((item, i) => (
                            <div key={i} className={`flex items-start gap-6 p-6 rounded-xl ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-white'} transition-colors`}>
                                <span className="material-symbols-outlined text-3xl text-primary p-3 bg-primary-fixed rounded-full flex-shrink-0">{item.icon}</span>
                                <div>
                                    <h4 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>{item.title}</h4>
                                    <p className={isDarkMode ? 'text-slate-400' : 'text-on-surface-variant'}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={`py-20 px-6 text-center ${isDarkMode ? 'bg-[#1e293b]' : 'bg-surface-container-low'}`}>
                <div className="max-w-3xl mx-auto">
                    <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-on-surface'} mb-6 font-headline`}>Ready to Experience AccessHelper?</h2>
                    <p className={`text-lg mb-10 ${isDarkMode ? 'text-slate-400' : 'text-on-surface-variant'}`}>
                        Start exploring our suite of accessibility tools and discover how technology can empower your independence.
                    </p>
                    <Link
                        to="/"
                        className="inline-block px-8 py-4 bg-primary text-white font-bold rounded-lg shadow-xl hover:shadow-primary/20 transition-all focus:ring-4 focus:ring-tertiary-fixed-dim outline-none text-lg no-underline"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </section>
        </Layout>
    );
};

export default About;
