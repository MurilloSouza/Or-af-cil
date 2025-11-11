import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getTranslator, Language, languages } from './localization';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  currency: string;
  setCurrency: (currency: string) => void;
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

export const supportedCurrencies = ['BRL', 'USD', 'EUR', 'GBP', 'JPY'];

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
    return 'pt'; // Default language
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    try {
        const storedCurrency = localStorage.getItem('app_currency');
        if (storedCurrency && supportedCurrencies.includes(storedCurrency)) {
            return storedCurrency;
        }
    } catch (e) {
        console.error("Could not read currency from localStorage", e);
    }
    return 'BRL'; // Default currency
  });


  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem('app_language', lang);
    } catch (e) {
      console.error("Could not save language to localStorage", e);
    }
    setLanguageState(lang);
  };
  
  const setCurrency = (curr: string) => {
    if (!supportedCurrencies.includes(curr)) return;
    try {
        localStorage.setItem('app_currency', curr);
    } catch (e) {
        console.error("Could not save currency to localStorage", e);
    }
    setCurrencyState(curr);
  };

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    return getTranslator(language)(key, replacements);
  }, [language]);
  
  const formatCurrency = useCallback((value: number) => {
    const locale = languageLocales[language] || 'pt-BR';
    try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    } catch (e) {
        // Fallback for invalid currency code, though it shouldn't happen with the check in setCurrency
        console.error("Currency formatting failed:", e);
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(value);
    }
  }, [language, currency]);

  const value = { language, setLanguage, currency, setCurrency, t, formatCurrency };

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