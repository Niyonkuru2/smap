import React, { createContext, useContext, ReactNode, useEffect } from 'react';

// DARK MODE ONLY - No light mode support
type Theme = 'dark';

interface ThemeContextType {
    theme: Theme;
    actualTheme: 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Force dark mode on mount and ensure it's never removed
    useEffect(() => {
        // Force dark mode
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
        
        // Clear any stored theme preference
        localStorage.removeItem('theme');
        
        // Ensure dark class stays
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target as HTMLElement;
                    if (!target.classList.contains('dark')) {
                        target.classList.add('dark');
                        target.classList.remove('light');
                    }
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        // Cleanup observer on unmount
        return () => observer.disconnect();
    }, []);

    return (
        <ThemeContext.Provider value={{ theme: 'dark', actualTheme: 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
