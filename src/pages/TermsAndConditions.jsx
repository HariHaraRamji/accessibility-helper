import React from 'react';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';

const TermsAndConditions = () => {
    const { isDarkMode } = useTheme();

    return (
        <Layout>
            <div className={`py-16 md:py-24 px-4 md:px-6 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-surface'}`}>
                <div className="max-w-4xl mx-auto">
                    <h1 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-on-surface'} mb-8 font-headline`}>
                        Terms and Conditions
                    </h1>
                    <div className={`prose prose-lg ${isDarkMode ? 'prose-invert text-slate-400' : 'text-on-surface-variant'} max-w-none`}>
                        <p className="mb-6">Last updated: April 1, 2026</p>
                        
                        <section className="mb-10">
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-primary'} mb-4`}>1. Acceptance of Terms</h2>
                            <p>By accessing and using AccessHelper, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>
                        </section>

                        <section className="mb-10">
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-primary'} mb-4`}>2. Use License</h2>
                            <p>AccessHelper is provided for personal, non-commercial use. You may not modify, copy, or reverse engineer the software.</p>
                        </section>

                        <section className="mb-10">
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-primary'} mb-4`}>3. Privacy</h2>
                            <p>Your use of AccessHelper is also governed by our Privacy Policy, which is incorporated into these terms by reference.</p>
                        </section>

                        <section className="mb-10">
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-primary'} mb-4`}>4. Disclaimer</h2>
                            <p>AccessHelper is provided "as is". While we strive for accuracy in our AI models, the service should not be used as a primary safety device for critical navigation or medical decisions.</p>
                        </section>

                        <section className="mb-10">
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-primary'} mb-4`}>5. Contact</h2>
                            <p>If you have any questions about these Terms, please contact us through the official support channels.</p>
                        </section>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TermsAndConditions;
