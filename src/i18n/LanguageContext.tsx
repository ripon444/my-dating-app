import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, translations } from './translations';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('gm_lang');
    return (saved as SupportedLanguage) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('gm_lang', currentLanguage);
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
    if (langConfig?.dir === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const langDict = translations[currentLanguage] || translations.en;
    let text = langDict[key] || translations.en[key] || key;

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }

    return text;
  };

  const isRTL = currentLanguage === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage: setCurrentLanguage,
        t,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
