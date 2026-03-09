import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, darkMode, setDarkMode }) => {
    const [isAccessibilityMode, setIsAccessibilityMode] = useState(() => localStorage.getItem('accessibilityMode') === 'true');

    useEffect(() => {
        document.body.setAttribute('data-accessibility', isAccessibilityMode ? 'enabled' : 'disabled');
        localStorage.setItem('accessibilityMode', isAccessibilityMode);
    }, [isAccessibilityMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);
    const toggleAccessibilityMode = () => setIsAccessibilityMode(!isAccessibilityMode);

    return (
        <ThemeContext.Provider value={{ isDarkMode: darkMode, isAccessibilityMode, toggleDarkMode, toggleAccessibilityMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
