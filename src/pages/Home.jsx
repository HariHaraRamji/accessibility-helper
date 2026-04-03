import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import bannerImg from '../assets/accessibility-banner.jpg';

const Home = () => {
    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 md:px-6 text-center bg-surface-container-lowest">
                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="inline-block px-4 py-1 mb-6 text-sm font-bold tracking-widest text-[#F59E0B] uppercase font-label">
                        EMPOWERING INDEPENDENCE
                    </span>
                    <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6 md:mb-8 leading-[1.1] font-headline">
                        Hear More. See More.<br />Live More.
                    </h1>
                    <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed font-body">
                        Revolutionary assistive technology designed to enhance your daily interaction with the world through real-time AI processing and empathetic design.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-primary text-on-primary font-bold rounded-lg shadow-xl hover:shadow-primary/20 transition-all focus:ring-4 focus:ring-tertiary-fixed-dim outline-none text-lg"
                        >
                            Get Started
                        </button>
                        <Link
                            to="/about"
                            className="px-8 py-4 bg-[#F59E0B] text-primary font-bold rounded-lg shadow-xl hover:shadow-amber-500/20 transition-all focus:ring-4 focus:ring-primary outline-none text-lg no-underline text-center"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-tertiary-fixed-dim rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
                </div>
            </section>

            {/* Feature Bento Grid */}
            <section id="features-section" className="py-16 md:py-24 px-4 md:px-6 bg-surface">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-8">
                        <div className="max-w-xl">
                            <h2 className="text-3xl font-bold text-on-surface mb-4 font-headline">Intelligent Assistance</h2>
                            <p className="text-on-surface-variant">Manage your accessibility toolkit from a single, high-contrast dashboard designed for maximum efficiency.</p>
                        </div>
                        <button className="hidden md:flex items-center gap-2 text-primary font-bold hover:underline focus:ring-4 focus:ring-tertiary-fixed-dim p-2 rounded outline-none">
                            View All Settings <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                        {/* Feature 1: Neural Narrator (Large) */}
                        <Link to="/tts" className="md:col-span-3 bg-surface-container-lowest border-outline-variant/30 hover:border-primary p-8 asymmetric-card shadow-sm border-2 transition-colors group no-underline">
                            <div className="flex justify-between items-start mb-16">
                                <div className="p-4 bg-primary text-on-primary rounded-xl shadow-lg">
                                    <span className="material-symbols-outlined text-4xl">campaign</span>
                                </div>
                                <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant font-bold rounded-full text-xs font-label">ACTIVE</span>
                            </div>
                            <h3 className="text-2xl font-bold text-on-surface mb-3">Neural Narrator</h3>
                            <p className="text-on-surface-variant mb-8 leading-relaxed">High-fidelity environmental audio description that transforms visual scenes into immersive spoken narratives.</p>
                            <span className="inline-flex items-center gap-2 text-primary font-extrabold group-hover:translate-x-2 transition-transform focus:ring-4 focus:ring-tertiary-fixed-dim p-1 outline-none">
                                Open Feature <span className="material-symbols-outlined">arrow_right_alt</span>
                            </span>
                        </Link>

                        {/* Feature 2: Smart Dictation */}
                        <Link to="/stt" className="md:col-span-3 bg-surface-container-lowest border-outline-variant/30 hover:border-[#06B6D4] p-8 asymmetric-card shadow-sm border-2 transition-colors group no-underline">
                            <div className="flex justify-between items-start mb-16">
                                <div className="p-4 bg-[#06B6D4] text-white rounded-xl shadow-lg">
                                    <span className="material-symbols-outlined text-4xl">mic</span>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-on-surface mb-3">Smart Dictation</h3>
                            <p className="text-on-surface-variant mb-8 leading-relaxed">Context-aware speech-to-text with 99.9% accuracy, supporting over 40 languages and dialects.</p>
                            <span className="inline-flex items-center gap-2 text-primary font-extrabold group-hover:translate-x-2 transition-transform focus:ring-4 focus:ring-tertiary-fixed-dim p-1 outline-none">
                                Open Feature <span className="material-symbols-outlined">arrow_right_alt</span>
                            </span>
                        </Link>

                        {/* Feature 3: Vision Intelligence */}
                        <Link to="/detection" className="md:col-span-2 bg-surface-container-lowest border-outline-variant/30 hover:border-[#10B981] p-8 asymmetric-card shadow-sm border-2 transition-colors group no-underline">
                            <div className="p-4 bg-[#10B981] text-white rounded-xl shadow-lg w-fit mb-8">
                                <span className="material-symbols-outlined text-3xl">visibility</span>
                            </div>
                            <h3 className="text-xl font-bold text-on-surface mb-2">Vision Intelligence</h3>
                            <p className="text-on-surface-variant text-sm mb-6">Object and text recognition optimized for low-light environments.</p>
                            <span className="inline-flex items-center gap-2 text-primary font-extrabold group-hover:translate-x-1 transition-transform focus:ring-4 focus:ring-tertiary-fixed-dim p-1 outline-none">
                                Open <span className="material-symbols-outlined">chevron_right</span>
                            </span>
                        </Link>

                        {/* Feature 4: Acoustic Alerts */}
                        <Link to="/sound" className="md:col-span-2 bg-surface-container-lowest border-outline-variant/30 hover:border-[#F59E0B] p-8 asymmetric-card shadow-sm border-2 transition-colors group no-underline">
                            <div className="p-4 bg-[#F59E0B] text-white rounded-xl shadow-lg w-fit mb-8">
                                <span className="material-symbols-outlined text-3xl">hearing</span>
                            </div>
                            <h3 className="text-xl font-bold text-on-surface mb-2">Acoustic Alerts</h3>
                            <p className="text-on-surface-variant text-sm mb-6">Visual and haptic feedback for critical environmental sounds like alarms or knocks.</p>
                            <span className="inline-flex items-center gap-2 text-primary font-extrabold group-hover:translate-x-1 transition-transform focus:ring-4 focus:ring-tertiary-fixed-dim p-1 outline-none">
                                Open <span className="material-symbols-outlined">chevron_right</span>
                            </span>
                        </Link>

                        {/* Feature 5: Health Reminders (Alert state) */}
                        <Link to="/medicine" className="md:col-span-2 bg-surface-container-lowest border-[#DC2626] p-8 asymmetric-card shadow-sm border-2 transition-colors group no-underline">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-4 bg-[#DC2626] text-white rounded-xl shadow-lg">
                                    <span className="material-symbols-outlined text-3xl">medication</span>
                                </div>
                                <span className="font-bold text-[#DC2626] font-label">ACTION REQUIRED</span>
                            </div>
                            <h3 className="text-xl font-bold text-on-surface mb-2">Health Reminders</h3>
                            <p className="text-on-surface-variant text-sm mb-6">Scheduled notification for medication and daily wellness checks.</p>
                            <span className="inline-flex items-center gap-2 text-[#DC2626] font-extrabold group-hover:translate-x-1 transition-transform focus:ring-4 focus:ring-tertiary-fixed-dim p-1 outline-none">
                                Review Now ! <span className="material-symbols-outlined">priority_high</span>
                            </span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Visual Context Section */}
            <section className="py-16 md:py-24 bg-surface-container-low px-4 md:px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="relative">
                            <img
                                src={bannerImg}
                                alt="Accessibility assistants and users"
                                className="rounded-2xl shadow-2xl w-full h-auto object-contain border-4 md:border-8 border-surface bg-[#0a1122]"
                            />
                            <div className="mt-8 bg-primary p-8 rounded-2xl shadow-2xl">
                                <p className="text-on-primary font-bold italic text-lg text-center">"Accessibility gives everyone the power to live independently and confidently every single day."</p>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="font-bold tracking-widest font-label text-primary">SYSTEM STATUS</span>
                        <h2 className="text-4xl font-bold text-on-surface mt-4 mb-8 font-headline">Uncompromising Performance</h2>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-colors">
                                <span className="material-symbols-outlined text-3xl text-primary">bolt</span>
                                <div>
                                    <h4 className="font-bold text-lg text-on-surface">0.02ms Latency</h4>
                                    <p className="text-on-surface-variant">Near-instant processing for real-time sound and vision analysis.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-colors">
                                <span className="material-symbols-outlined text-3xl text-[#10B981]">security</span>
                                <div>
                                    <h4 className="font-bold text-lg text-on-surface">Local-First Privacy</h4>
                                    <p className="text-on-surface-variant">Your data never leaves your device. All AI processing happens on the edge.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-colors">
                                <span className="material-symbols-outlined text-3xl text-[#F59E0B]">battery_full</span>
                                <div>
                                    <h4 className="font-bold text-lg text-on-surface">Optimized Efficiency</h4>
                                    <p className="text-on-surface-variant">Engineered to preserve mobile battery life while maintaining peak performance.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Home;
