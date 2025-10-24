import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getTranslator, Language, languages } from './localization';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  formatCurrency: (value: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const languageLocales: Record<Language, string> = {
    en: 'en-US',
    pt: 'pt-BR',
    zh: 'zh-CN',
    es: 'es-ES',
    de: 'de-DE'
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem('app_language');
      if (storedLang && Object.keys(languages).includes(storedLang)) {
        return storedLang as Language;
      }
    } catch (e) {
      console.error("Could not read language from localStorage", e);
    }
    return 'en'; // Default language
  });

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem('app_language', lang);
    } catch (e) {
      console.error("Could not save language to localStorage", e);
    }
    setLanguageState(lang);
  };

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    return getTranslator(language)(key, replacements);
  }, [language]);
  
  const formatCurrency = useCallback((value: number) => {
    const locale = languageLocales[language] || 'en-US';
    // The app is brazilian-focused, so currency is hardcoded to BRL
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(value);
  }, [language]);

  const value = { language, setLanguage, t, formatCurrency };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLocalization = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LanguageProvider');
  }
  return context;
};
