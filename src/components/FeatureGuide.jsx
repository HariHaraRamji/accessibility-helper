import React, { useState } from 'react';

const FeatureGuide = ({ title, steps = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Small trigger button */}
            <button
                onClick={() => setIsOpen(true)}
                aria-label="How to use this feature"
                title="How to use this feature"
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '900',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px var(--accent-glow)',
                    transition: 'all 0.25s ease',
                    flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 6px 20px var(--accent-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px var(--accent-glow)'; }}
            >
                ?
            </button>

            {/* Modal overlay */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 5000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        animation: 'guideOverlayFadeIn 0.25s ease',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
                >
                    {/* Backdrop */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }} />

                    {/* Modal */}
                    <div style={{
                        position: 'relative',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '24px',
                        padding: '2rem',
                        maxWidth: '520px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
                        animation: 'guideModalSlideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.15em', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    📖 HOW TO USE
                                </div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                                    {title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)',
                                    cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease', flexShrink: 0,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-inner)'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {steps.map((step, index) => (
                                <div key={index} style={{
                                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                    padding: '1rem',
                                    background: 'var(--bg-card-inner)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-subtle)',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: 'var(--accent-gradient)', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '900', fontSize: '0.85rem', flexShrink: 0,
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                                            {step.title}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                            {step.description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                width: '100%', marginTop: '1.5rem',
                                background: 'var(--accent-gradient)', color: '#fff',
                                padding: '1rem', borderRadius: '50px', border: 'none',
                                fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer',
                                boxShadow: '0 4px 16px var(--accent-glow)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes guideOverlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes guideModalSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
};

export default FeatureGuide;
