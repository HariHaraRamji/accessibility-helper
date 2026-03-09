import React from 'react';
import Layout from '../components/Layout';

const Placeholder = ({ title }) => (
    <Layout title={title}>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            <h2>{title} Functionality Coming Soon</h2>
            <p style={{ marginTop: 'var(--spacing-md)' }}>
                This page will eventually allow users to interact with {title.toLowerCase()} features.
            </p>
        </div>
    </Layout>
);

export const TTS = () => <Placeholder title="Text to Speech" />;
export const STT = () => <Placeholder title="Speech to Text Notes" />;
