import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import ReactCountryFlag from "react-country-flag";
import "./LanguageSwitcher.css";

const languages = [
  { code: "az", label: "AZ", country: "AZ", name: "Azərbaycan" },
  { code: "en", label: "EN", country: "GB", name: "English" },
  { code: "ru", label: "RU", country: "RU", name: "Русский" }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language: contextLanguage, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const switcherRef = useRef(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLang = (code) => {
    changeLanguage(code); // Context-dəki funksiya artıq localStorage və i18n-i yeniləyir
    setOpen(false);
    
    // Butona animasiya əlavə etmək üçün
    const btn = document.querySelector('.lang-btn');
    if (btn) {
      btn.classList.add('lang-changing');
      setTimeout(() => {
        btn.classList.remove('lang-changing');
      }, 400);
    }
  };

  // Ekrana kliklədikdə dropdown-ı bağlamaq üçün
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Escape düyməsinə basıldıqda bağlamaq üçün
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [open]);

  return (
    <div className="lang-switcher" ref={switcherRef}>
      {/* BUTTON */}
      <button
        className={`lang-btn ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
        type="button"
        aria-label="Dil seç"
      >
        <ReactCountryFlag
          svg
          countryCode={currentLang.country}
          className="flag-svg"
          aria-label={currentLang.name}
        />
        <span className="label">{currentLang.label}</span>
        <span className="arrow">▾</span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="lang-dropdown show">
          {languages.map(lang => (
            <div
              key={lang.code}
              className={`lang-item ${
                i18n.language === lang.code ? "active" : ""
              }`}
              onClick={() => changeLang(lang.code)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  changeLang(lang.code);
                }
              }}
            >
              <ReactCountryFlag
                svg
                countryCode={lang.country}
                className="flag-svg"
                aria-label={lang.name}
              />
              <span className="label">{lang.label}</span>
              <span className="lang-name">{lang.name}</span>
              {i18n.language === lang.code && (
                <span className="check">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}