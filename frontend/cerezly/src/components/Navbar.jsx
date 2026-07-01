// Navbar.js - ANDROID CONTACT FIX WITH LOGIN BUTTON
import React, { useState, useRef, useEffect } from "react";
import { FiMenu, FiX, FiShoppingCart } from "react-icons/fi";
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const loginButtonRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { getTotalItems } = useCart();
  const cartItemsCount = getTotalItems();

  // ✅ Login statusunu yoxla
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('userData');
      setIsLoggedIn(!!(token && userData));
    };
    
    checkAuth();
    
    // Storage dəyişdikdə yenilə
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // ✅ Login uğurlu olduqda yenilə
    const handleLoginSuccess = () => {
      checkAuth();
    };
    
    window.addEventListener('loginSuccess', handleLoginSuccess);
    window.addEventListener('loginModalClosed', checkAuth);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('loginModalClosed', checkAuth);
    };
  }, []);

  // Login modalını açmaq üçün funksiya
  const openLoginModal = () => {
    if (loginButtonRef.current && loginButtonRef.current.openModal) {
      loginButtonRef.current.openModal();
    } else {
      const loginBtn = document.querySelector('.auth-login-btn, .login-button');
      if (loginBtn) {
        loginBtn.click();
      }
    }
  };

  // Android scroll funksiyası
  const scrollToSection = (sectionId, e) => {
    if (e) e.preventDefault();

    const isAndroid = /android/i.test(navigator.userAgent);
    const isMobile = /mobile/i.test(navigator.userAgent);

    setMobileOpen(false);

    if (location.pathname === "/") {
      if (isAndroid && isMobile && sectionId === 'contact') {
        console.log('📱 Android Contact fix aktiv');
        
        const scrollToContact = () => {
          const element = document.getElementById('contact');
          const navbar = document.querySelector('.navbar');
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          
          if (element) {
            const elementRect = element.getBoundingClientRect();
            const scrollPosition = elementRect.top + window.pageYOffset - navbarHeight;
            
            window.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
            
            window.history.pushState({}, "", `#${sectionId}`);
            console.log('✅ Android Contact scroll tamam');
          } else {
            console.log('⚠️ Contact section tapılmadı, yenidən cəhd...');
            setTimeout(scrollToContact, 100);
          }
        };
        
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
        
        setTimeout(scrollToContact, 100);
        
      } else {
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

  const handleCampaignsClick = (e) => {
    e.preventDefault();
    setMobileOpen(false);
    navigate('/kampaniyalar');
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
          <li>
            <a href="/kampaniyalar" onClick={handleCampaignsClick}>
              {t("nav.campaigns")}
            </a>
          </li>
        </ul>

        <div className="nav-right">
          <LanguageSwitcher />
          <LoginButton ref={loginButtonRef} />

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
              <li>
                <a href="/kampaniyalar" onClick={handleCampaignsClick}>
                  {t("nav.campaigns")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}

      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        onOpenLoginModal={openLoginModal}
      />
    </>
  );
}