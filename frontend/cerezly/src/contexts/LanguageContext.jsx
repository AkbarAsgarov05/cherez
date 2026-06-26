import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  
  // Hər dəfə localStorage-dan oxuyan funksiya
  const getCurrentLanguage = () => {
    return localStorage.getItem('preferredLanguage') || 'az';
  };

  const [language, setLanguage] = useState(getCurrentLanguage());

  // Dil dəyişdirmə funksiyası
  const changeLanguage = useCallback((lang) => {
    localStorage.setItem('preferredLanguage', lang);
    setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    
    // Səhifədəki bütün mətnləri yenilə
    window.dispatchEvent(new Event('languageChanged'));
  }, [i18n]);

  // Popstate (geri/irəli) olayını dinlə
  useEffect(() => {
    const handlePopState = () => {
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang && savedLang !== language) {
        setLanguage(savedLang);
        i18n.changeLanguage(savedLang);
        document.documentElement.lang = savedLang;
        window.dispatchEvent(new Event('languageChanged'));
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Sayt açıldıqda dilin düzgün olduğuna əmin ol
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
      document.documentElement.lang = savedLang;
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [i18n, language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};