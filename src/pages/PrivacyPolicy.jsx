import React from 'react';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';

const PrivacyPolicy = () => {
    const { isDarkMode } = useTheme();

    const sectionClass = `mb-10`;
    const headingClass = `text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-on-surface'} mb-4 font-headline`;
    const subHeadingClass = `text-lg font-bold ${isDarkMode ? 'text-blue-300' : 'text-primary'} mb-3`;
    const textClass = `${isDarkMode ? 'text-slate-400' : 'text-on-surface-variant'} leading-relaxed mb-4`;

    return (
        <Layout>
            <section className={`py-20 px-6 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-surface-container-lowest'}`}>
                <div className="max-w-4xl mx-auto">
                    <span className="inline-block px-4 py-1 mb-6 text-sm font-bold tracking-widest text-[#F59E0B] uppercase font-label">
                        LEGAL
                    </span>
                    <h1 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-[#1E3A8A]'} mb-8 leading-[1.1] font-headline`}>
                        Privacy Policy
                    </h1>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'} mb-12`}>
                        Last updated: March 2026
                    </p>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>1. Introduction</h2>
                        <p className={textClass}>
                            Welcome to AccessHelper. We are committed to protecting your privacy and ensuring a safe experience while using our accessibility tools. This Privacy Policy explains how we handle your information when you use the AccessHelper application.
                        </p>
                    </div>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>2. Information We Collect</h2>
                        
                        <h3 className={subHeadingClass}>2.1 Data Processed Locally</h3>
                        <p className={textClass}>
                            AccessHelper is built with a <strong>privacy-first, local-processing architecture</strong>. The following data is processed entirely on your device and is <strong>never transmitted to external servers</strong>:
                        </p>
                        <ul className={`${textClass} list-disc pl-8 space-y-2`}>
                            <li>Audio input for speech-to-text conversion</li>
                            <li>Text input for text-to-speech conversion</li>
                            <li>Camera/image data for object detection and vision features</li>
                            <li>Sound detection and acoustic alert processing</li>
                            <li>Medication reminder schedules and health data</li>
                        </ul>

                        <h3 className={subHeadingClass}>2.2 Stored Data</h3>
                        <p className={textClass}>
                            Some data is stored locally on your device (using browser localStorage) to improve your experience:
                        </p>
                        <ul className={`${textClass} list-disc pl-8 space-y-2`}>
                            <li>User preferences (theme settings, language preferences)</li>
                            <li>Medication reminder schedules</li>
                            <li>Application settings and configurations</li>
                        </ul>
                    </div>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>3. How We Use Your Information</h2>
                        <p className={textClass}>
                            All data processing serves the sole purpose of providing accessibility features to you:
                        </p>
                        <ul className={`${textClass} list-disc pl-8 space-y-2`}>
                            <li><strong>Speech-to-Text:</strong> Converting your voice input into text for note-taking and communication</li>
                            <li><strong>Text-to-Speech:</strong> Reading text content aloud with natural-sounding AI voices</li>
                            <li><strong>Object Detection:</strong> Identifying objects and text in your environment to assist navigation</li>
                            <li><strong>Sound Detection:</strong> Alerting you to important environmental sounds</li>
                            <li><strong>Medication Reminders:</strong> Sending timely notifications for your health routines</li>
                        </ul>
                    </div>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>4. Data Sharing</h2>
                        <p className={textClass}>
                            <strong>We do not sell, trade, or share your personal data with any third parties.</strong> Since AccessHelper processes all data locally on your device, your information remains entirely under your control.
                        </p>
                    </div>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>5. Data Security</h2>
                        <p className={textClass}>
                            AccessHelper employs a local-first security model:
                        </p>
                        <ul className={`${textClass} list-disc pl-8 space-y-2`}>
                            <li>All AI processing happens on-device — no cloud transmission</li>
                            <li>No external API calls are made with your personal data</li>
                            <li>Stored preferences use the browser's built-in secure storage mechanisms</li>
                            <li>No tracking cookies or analytics scripts are used</li>
                        </ul>
                    </div>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>6. Your Rights</h2>
                        <p className={textClass}>
                            You have full control over your data at all times:
                        </p>
                        <ul className={`${textClass} list-disc pl-8 space-y-2`}>
                            <li><strong>Access:</strong> All your data is stored locally and accessible on your device</li>
                            <li><strong>Delete:</strong> Clear your browser's localStorage to remove all stored preferences</li>
                            <li><strong>Portability:</strong> Your data stays on your device and can be managed through browser settings</li>
                        </ul>
                    </div>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>7. Children's Privacy</h2>
                        <p className={textClass}>
                            AccessHelper is designed to be used by people of all ages. Since we do not collect or transmit any personal data, there are no special privacy concerns for younger users.
                        </p>
                    </div>

                    <div className={sectionClass}>
                        <h2 className={headingClass}>8. Changes to This Policy</h2>
                        <p className={textClass}>
                            We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
                        </p>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-surface-container-low border-outline-variant'} p-8 rounded-2xl border-2 mt-12`}>
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-on-surface'} mb-3`}>Questions?</h3>
                        <p className={textClass}>
                            If you have any questions about this Privacy Policy or AccessHelper's data practices, please reach out through the application's help section.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default PrivacyPolicy;
