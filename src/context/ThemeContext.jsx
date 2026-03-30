import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, darkMode, setDarkMode }) => {
    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev;
            if (next) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
            localStorage.setItem("darkMode", String(next));
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode: darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
