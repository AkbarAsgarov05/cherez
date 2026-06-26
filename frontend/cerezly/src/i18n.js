// i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

import az from "./locales/az/translation.json";
import en from "./locales/en/translation.json";
import ru from "./locales/ru/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      az: { translation: az },
      en: { translation: en },
      ru: { translation: ru }
    },
    lng: localStorage.getItem('preferredLanguage') || "az",
    fallbackLng: "az",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage'
    }
  });

// Dil dəyişdikdə localStorage-ı yenilə
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferredLanguage', lng);
  document.documentElement.lang = lng;
});

export default i18n;