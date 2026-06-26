import React, { useEffect, useState, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import "./Hero.css";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [productCount, setProductCount] = useState(0);
  const [naturalPercent, setNaturalPercent] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  const animationStarted = useRef(false);

  useEffect(() => {
    if (animationStarted.current) return;
    animationStarted.current = true;

    let startProduct = 0;
    let startNatural = 0;
    let startCustomer = 0;

    const endProduct = 500;
    const endNatural = 100;
    const endCustomer = 10000;

    const animate = () => {
      if (startProduct < endProduct) {
        startProduct += 5;
        setProductCount(startProduct);
      }

      if (startNatural < endNatural) {
        startNatural += 1;
        setNaturalPercent(startNatural);
      }

      if (startCustomer < endCustomer) {
        const increment = Math.min(80, endCustomer - startCustomer);
        startCustomer += increment;
        setCustomerCount(startCustomer);
      }

      if (
        startProduct >= endProduct &&
        startNatural >= endNatural &&
        startCustomer >= endCustomer
      ) {
        return;
      }

      requestAnimationFrame(animate);
    };

    setTimeout(() => {
      requestAnimationFrame(animate);
    }, 300);
  }, []);

  // ✅ SADƏ VERSİYA - Haqqımızda butonu
  const goToAbout = () => {
    // Əvvəlcə yuxarı scroll et
    window.scrollTo(0, 0);
    
    // Sonra About section-a scroll et
    setTimeout(() => {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        aboutSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        
        // URL-də hash-i yenilə
        window.history.pushState({}, "", "#about");
      }
    }, 100);
  };

  // ✅ SADƏ VERSİYA - Məhsullar butonu
  const goToProducts = () => {
    // Əvvəlcə yuxarı scroll et
    window.scrollTo(0, 0);
    
    // Sonra Products section-a scroll et
    setTimeout(() => {
      const productsSection = document.getElementById("products");
      if (productsSection) {
        productsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        
        // URL-də hash-i yenilə
        window.history.pushState({}, "", "#products");
      }
    }, 100);
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <div className="premium-badge">
          <span>🥜</span> {t("hero.badge")}
        </div>

        <h1 className="hero-title">
          <Trans
            i18nKey="hero.title"
            components={{ 1: <span /> }}
          />
        </h1>

        <p className="hero-text">
          {t("hero.description")}
        </p>

        <div className="hero-buttons">
          <button className="btn primary" onClick={goToProducts}>
            {t("hero.buttons.products")}
          </button>
          <button className="btn secondary" onClick={goToAbout}>
            {t("hero.buttons.about")}
          </button>
        </div>

        <div className="hero-stats">
          <div>
            <h2>{productCount}+</h2>
            <p>{t("hero.stats.products")}</p>
          </div>

          <div>
            <h2>{naturalPercent}%</h2>
            <p>{t("hero.stats.natural")}</p>
          </div>

          <div>
            <h2>
              {customerCount >= 10000
                ? "10K+"
                : customerCount.toLocaleString()}
            </h2>
            <p>{t("hero.stats.customers")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;