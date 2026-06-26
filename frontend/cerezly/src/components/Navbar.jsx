// Navbar.js - ANDROID CONTACT FIX WITH LOGIN BUTTON
import React, { useState, useRef, useEffect } from "react";
import { FiMenu, FiX, FiSearch, FiShoppingCart } from "react-icons/fi";
import { useCart } from "../contexts/CartContext";
import CartModal from "./CartModal";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import LoginButton from "./LoginButton";
import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [mobileSearchValue, setMobileSearchValue] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const mobileSearchRef = useRef(null);
  const loginButtonRef = useRef(null); // Login butonuna referans

  const navigate = useNavigate();
  const location = useLocation();

  const { getTotalItems } = useCart();
  const cartItemsCount = getTotalItems();

  useEffect(() => {
    if (mobileOpen && mobileSearchRef.current) {
      const timer = setTimeout(() => {
        mobileSearchRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mobileOpen]);

  // Login modalını açmaq üçün funksiya
  const openLoginModal = () => {
    // LoginButton componentindeki openModal funksiyasını çağır
    if (loginButtonRef.current && loginButtonRef.current.openModal) {
      loginButtonRef.current.openModal();
    } else {
      // Alternativ: Login butonunu tap və tıklama eventi göndər
      const loginBtn = document.querySelector('.auth-login-btn, .login-button');
      if (loginBtn) {
        loginBtn.click();
      }
    }
  };

  // ✅ YENİ: Android üçün xüsusi scroll funksiyası
  const scrollToSection = (sectionId, e) => {
    if (e) e.preventDefault();

    // Android cihaz yoxla
    const isAndroid = /android/i.test(navigator.userAgent);
    const isMobile = /mobile/i.test(navigator.userAgent);

    setMobileOpen(false);

    if (location.pathname === "/") {
      // Android və Contact section üçün xüsusi logic
      if (isAndroid && isMobile && sectionId === 'contact') {
        console.log('📱 Android Contact fix aktiv');
        
        // Android üçün manual scroll
        const scrollToContact = () => {
          const element = document.getElementById('contact');
          const navbar = document.querySelector('.navbar');
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          
          if (element) {
            // Elementin mövqeyini hesabla
            const elementRect = element.getBoundingClientRect();
            const scrollPosition = elementRect.top + window.pageYOffset - navbarHeight;
            
            // Smooth scroll et
            window.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
            
            // URL-də hash-i yenilə
            window.history.pushState({}, "", `#${sectionId}`);
            console.log('✅ Android Contact scroll tamam');
          } else {
            console.log('⚠️ Contact section tapılmadı, yenidən cəhd...');
            // Element tapılmadısa, yenidən cəhd et
            setTimeout(scrollToContact, 100);
          }
        };
        
        // Əvvəlcə yuxarı scroll et
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
        
        // Sonra Contact section-a scroll et
        setTimeout(scrollToContact, 100);
        
      } else {
        // Digər sectionlar üçün normal scroll
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          window.history.pushState({}, "", `#${sectionId}`);
        }
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const handleMobileSearchChange = (e) => {
    setMobileSearchValue(e.target.value);
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <img src="/logo.png" alt="logo" className="logo-icon" />
          <span className="logo-text">Çərəz</span>
        </div>

        <ul className="nav-links">
          <li>
            <a href="/#hero" onClick={(e) => scrollToSection("hero", e)}>
              {t("nav.home")}
            </a>
          </li>
          <li>
            <a href="/#products" onClick={(e) => scrollToSection("products", e)}>
              {t("nav.products")}
            </a>
          </li>
          <li>
            <a href="/#about" onClick={(e) => scrollToSection("about", e)}>
              {t("nav.about")}
            </a>
          </li>
          <li>
            <a href="/#contact" onClick={(e) => scrollToSection("contact", e)}>
              {t("nav.contact")}
            </a>
          </li>
        </ul>

        <div className="nav-right">
          <LanguageSwitcher />

          {/* ✅ LOGIN BUTTON - ref əlavə edildi */}
          <LoginButton ref={loginButtonRef} />

          <div className={`search-box ${searchActive ? "active" : ""}`}>
            <FiSearch
              className="search-icon"
              onClick={() => setSearchActive(!searchActive)}
            />
            <input
              type="text"
              placeholder={t("search.placeholder")}
              className={`search-input ${searchActive ? "visible" : ""}`}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setSearchActive(false)}
              style={{
                outline: "none",
                boxShadow: "none",
                border: "none",
              }}
            />
          </div>

          <div className="cart-icon-wrapper" onClick={handleCartClick}>
            <FiShoppingCart className="cart-icon" />
            {cartItemsCount > 0 && (
              <span className="cart-count">{cartItemsCount}</span>
            )}
          </div>

          <button
            className={`hamburger ${mobileOpen ? "active" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
          >
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <ul className="mobile-links">
              <li>
                <a href="/#hero" onClick={(e) => scrollToSection("hero", e)}>
                  {t("nav.home")}
                </a>
              </li>
              <li>
                <a href="/#products" onClick={(e) => scrollToSection("products", e)}>
                  {t("nav.products")}
                </a>
              </li>
              <li>
                <a href="/#about" onClick={(e) => scrollToSection("about", e)}>
                  {t("nav.about")}
                </a>
              </li>
              <li>
                <a href="/#contact" onClick={(e) => scrollToSection("contact", e)}>
                  {t("nav.contact")}
                </a>
              </li>
            </ul>

            <div className="mobile-search-container">
              <div className="mobile-search-box">
                <FiSearch className="mobile-search-icon" />
                <input
                  ref={mobileSearchRef}
                  type="text"
                  placeholder={t("search.placeholder")}
                  className="mobile-search-input"
                  value={mobileSearchValue}
                  onChange={handleMobileSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{
                    outline: "none",
                    boxShadow: "none",
                    border: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CartModal-a onOpenLoginModal prop-u əlavə edildi */}
      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        onOpenLoginModal={openLoginModal}
      />
    </>
  );
}