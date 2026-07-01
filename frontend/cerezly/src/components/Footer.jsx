import React, { useEffect, useRef, useState } from "react";
import {
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
} from "react-icons/fi";
import { FaTelegramPlane, FaTiktok } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./Footer.css";

// ✅ DÜZGÜN - Environment variable ilə
const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';

export default function Footer() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionsRef = useRef([]);
  const bottomRef = useRef(null);

  // Backend-dən kateqoriyaları yüklə - DÜZƏLDİLDİ
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // ✅ DÜZGÜN - API_URL istifadə edir
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error("Kateqoriyalar yüklənərkən xəta:", error);
        // Xəta olarsa default kateqoriyaları göstər
        setCategories([
          { _id: "1", name: "Meyvə quruları" },
          { _id: "2", name: "Duzlu çərəzlər" },
          { _id: "3", name: "Şokoladlı çərəzlər" },
          { _id: "4", name: "Ədviyyatlar" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Kateqoriya adını slug-a çevir (URL üçün)
  const createSlug = (name) => {
    const slugMap = {
      'Meyvə quruları': 'meyve-qurulari',
      'Duzlu çərəzlər': 'duzlu-cerezler',
      'Şokoladlı çərəzlər': 'sokokladli-cerezler',
      'Ədviyyatlar': 'edviyyatlar',
      'Paxlalılar və Taxıllar': 'paxlalilar-ve-taxillar',
      'Bitki Yağları': 'bitki-yaglari',
      'Qurudulmuş Otlar və Çaylar': 'qurudulmus-otlar-ve-caylar',
      'Hədiyyə paketləri': 'hediyye-paketleri'
    };
    return slugMap[name] || name.toLowerCase().replace(/ /g, '-').replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u').replace(/[şŞ]/g, 's').replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c').replace(/[əƏ]/g, 'e');
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sectionsRef.current.forEach((section, index) => {
              if (section && entry.target === section) {
                section.classList.add('section-visible');
              }
            });
            
            if (entry.target === bottomRef.current) {
              setTimeout(() => {
                entry.target.classList.add('bottom-visible');
              }, 400);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    sectionsRef.current.forEach(section => section && observer.observe(section));
    if (bottomRef.current) observer.observe(bottomRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* ========= 1. LOGO & SOSİAL MEDİA ========= */}
        <div 
          ref={el => sectionsRef.current[0] = el}
          className="footer-section section-hidden"
        >
          <h2 className="footer-logo logo-hidden">Çərəz</h2>
          <p className="footer-text text-hidden">
            {t('footer.description')}
          </p>

          <div className="footer-icons">
            <button 
              className="social-link instagram-link social-hidden" 
              aria-label="Instagram"
              onMouseEnter={(e) => e.currentTarget.classList.add('instagram-hover')}
              onMouseLeave={(e) => e.currentTarget.classList.remove('instagram-hover')}
            >
              <FiInstagram />
              <div className="social-gradient"></div>
            </button>

            <button 
              className="social-link facebook-link social-hidden" 
              aria-label="Facebook"
              onMouseEnter={(e) => e.currentTarget.classList.add('facebook-hover')}
              onMouseLeave={(e) => e.currentTarget.classList.remove('facebook-hover')}
            >
              <FiFacebook />
              <div className="social-gradient"></div>
            </button>

            <button 
              className="social-link tiktok-link social-hidden" 
              aria-label="TikTok"
              onMouseEnter={(e) => e.currentTarget.classList.add('tiktok-hover')}
              onMouseLeave={(e) => e.currentTarget.classList.remove('tiktok-hover')}
            >
              <FaTiktok />
              <div className="social-gradient"></div>
            </button>

            <button 
              className="social-link telegram-link social-hidden" 
              aria-label="Telegram"
              onMouseEnter={(e) => e.currentTarget.classList.add('telegram-hover')}
              onMouseLeave={(e) => e.currentTarget.classList.remove('telegram-hover')}
            >
              <FaTelegramPlane />
              <div className="social-gradient"></div>
            </button>

            <button 
              className="social-link linkedin-link social-hidden" 
              aria-label="LinkedIn"
              onMouseEnter={(e) => e.currentTarget.classList.add('linkedin-hover')}
              onMouseLeave={(e) => e.currentTarget.classList.remove('linkedin-hover')}
            >
              <FiLinkedin />
              <div className="social-gradient"></div>
            </button>
          </div>
        </div>

        {/* ========= 2. KATEQORİYALAR - DİNAMİK ========= */}
        <div 
          ref={el => sectionsRef.current[1] = el}
          className="footer-section section-hidden"
        >
          <h3 className="footer-title title-hidden">
            {t('footer.sections.products.title')}
          </h3>

          <div className="footer-links-container">
            {loading ? (
              <div className="footer-link link-hidden">Yüklənir...</div>
            ) : (
              categories.map((category) => (
                <a 
                  key={category._id} 
                  className="footer-link link-hidden" 
                  href={`/kateqoriya/${createSlug(category.name)}`}
                >
                  {category.name}
                </a>
              ))
            )}
          </div>
        </div>

        {/* ========= 3. KEÇİDLƏR ========= */}
        <div 
          ref={el => sectionsRef.current[2] = el}
          className="footer-section section-hidden"
        >
          <h3 className="footer-title title-hidden">
            {t('footer.sections.links.title')}
          </h3>

          <div className="footer-links-container">
            <a className="footer-link link-hidden" href="/about">
              {t('footer.sections.links.about')}
            </a>
            <a className="footer-link link-hidden" href="/blog">
              {t('footer.sections.links.blog')}
            </a>
            <a className="footer-link link-hidden" href="/kampaniyalar">
              {t('footer.sections.links.campaigns')}
            </a>
            <a className="footer-link link-hidden" href="/contact">
              {t('footer.sections.links.contact')}
            </a>
            <a className="footer-link link-hidden" href="/faq">
              {t('footer.sections.links.faq')}
            </a>
          </div>
        </div>

        {/* ========= 4. ƏLAQƏ ========= */}
        <div 
          ref={el => sectionsRef.current[3] = el}
          className="footer-section section-hidden"
        >
          <h3 className="footer-title title-hidden">
            {t('footer.sections.contact.title')}
          </h3>

          <div className="footer-contact-container">
            <div className="footer-row row-hidden">
              <FiMapPin className="footer-icon" /> 
              {t('footer.sections.contact.address')}
            </div>
            <div className="footer-row row-hidden">
              <FiPhone className="footer-icon" /> 
              {t('footer.sections.contact.phone')}
            </div>
            <div className="footer-row row-hidden">
              <FiMail className="footer-icon" /> 
              {t('footer.sections.contact.email')}
            </div>
            <div className="footer-row row-hidden">
              <FiClock className="footer-icon" /> 
              {t('footer.sections.contact.hours')}
            </div>
          </div>
        </div>
      </div>

      {/* ========= ALT PANEL ========= */}
      <div ref={bottomRef} className="footer-bottom bottom-hidden">
        <div className="footer-bottom-left">
          <p className="copyright-hidden">
            © 2025 Çərəz. Bütün hüquqlar qorunur.
          </p>
        </div>
        <div className="footer-bottom-right">
          <a href="/privacy-policy" className="footer-bottom-link">
            Məxfilik Siyasəti
          </a>
          <span className="footer-link-separator">|</span>
          <a href="/terms-of-service" className="footer-bottom-link">
            İstifadəçi Şərtləri
          </a>
        </div>
      </div>
    </footer>
  );
}