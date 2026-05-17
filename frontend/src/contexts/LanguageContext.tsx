import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'app_language';

const UNIFIED_COLOR = '45 95% 50%'; 

// Helper to get initial language
function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && ['en', 'rw', 'fr'].includes(saved)) {
      return saved as Language;
    }
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Apply unified dark green color on mount and persist it
  useEffect(() => {
    const root = document.documentElement;
    const hslColor = `hsl(${UNIFIED_COLOR})`;
    
    console.log(`✅ Applying unified yellow-gold color: ${hslColor}`);
    
    // FORCE dark mode
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    
    // Create or update a dynamic style tag for color consistency
    let themeStyle = document.getElementById('theme-colors-dynamic');
    if (!themeStyle) {
      themeStyle = document.createElement('style');
      themeStyle.id = 'theme-colors-dynamic';
      document.head.appendChild(themeStyle);
    }
    
    // Apply ALL unified colors with !important
    themeStyle.textContent = `
      :root, .dark {
        --background: 45 95% 50% !important;
        --foreground: 0 0% 15% !important;
        --card: 45 95% 48% !important;
        --primary: 45 95% 50% !important;
        --primary-foreground: 0 0% 15% !important;
        --secondary: 45 90% 48% !important;
        --secondary-foreground: 0 0% 15% !important;
        --accent: 45 95% 52% !important;
        --accent-foreground: 0 0% 15% !important;
        --muted: 45 80% 60% !important;
        --border: 45 85% 45% !important;
      }
      body, html {
        background: hsl(45, 95%, 50%) !important;
        color: hsl(0, 0%, 15%) !important;
      }
    `;
    
    // Also set directly on root element
    root.style.setProperty('--primary', '45 95% 50%', 'important');
    root.style.setProperty('--secondary', '45 90% 48%', 'important');
    root.style.setProperty('--accent', '45 95% 52%', 'important');
    root.style.setProperty('--background', '45 95% 50%', 'important');
    root.style.setProperty('--foreground', '0 0% 15%', 'important');
    
  }, []);

  // Change language and persist to localStorage
  const setLanguage = (lang: Language) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLanguageState(lang);
  };

  // Translation function - uses current language directly
  const t = (key: string): string => {
    return getTranslation(language, key as any);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
