import React, { useEffect, useRef, useState } from "react";
import "./Contact.css";
import { FaMapMarkerAlt, FaPhoneAlt, FaClock, FaEnvelope } from "react-icons/fa";
import { useTranslation, Trans } from "react-i18next";
import { sendContactMessage } from "../services/messageService";

export default function Contact() {
  const { t, i18n } = useTranslation();
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const infoCardsRef = useRef([]);
  const formRef = useRef(null);
  const mapContainerRef = useRef(null);
  
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const messageRef = useRef(null);
  
  const [phoneValue, setPhoneValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dilə görə mesajları qaytaran funksiya
  const getLocalizedMessage = (key) => {
    const lang = i18n.language;
    const messages = {
      nameRequired: {
        az: "Zəhmət olmasa adınızı və soyadınızı daxil edin!",
        en: "Please enter your name and surname!",
        ru: "Пожалуйста, введите ваше имя и фамилию!"
      },
      nameInvalid: {
        az: "Ad və soyad yalnız hərflər, boşluq və tire işarəsindən ibarət ola bilər!",
        en: "Name and surname can only contain letters, spaces and hyphens!",
        ru: "Имя и фамилия могут содержать только буквы, пробелы и дефисы!"
      },
      phoneRequired: {
        az: "Zəhmət olmasa telefon nömrənizi daxil edin!",
        en: "Please enter your phone number!",
        ru: "Пожалуйста, введите ваш номер телефона!"
      },
      phoneInvalid: {
        az: "Zəhmət olmasa düzgün telefon nömrəsi daxil edin! (9-12 rəqəm)",
        en: "Please enter a valid phone number! (9-12 digits)",
        ru: "Пожалуйста, введите правильный номер телефона! (9-12 цифр)"
      },
      messageRequired: {
        az: "Zəhmət olmasa mesajınızı daxil edin!",
        en: "Please enter your message!",
        ru: "Пожалуйста, введите ваше сообщение!"
      },
      messageTooShort: {
        az: "Mesajınız minimum 5 simvol olmalıdır!",
        en: "Your message must be at least 5 characters long!",
        ru: "Ваше сообщение должно содержать не менее 5 символов!"
      },
      // ✅ EMAİL VALİDASİYA MESAJI - YALNIZ EMAİL YAZILANDA ÇIXACAQ
      emailInvalid: {
        az: "Zəhmət olmasa düzgün e-poçt ünvanı daxil edin!",
        en: "Please enter a valid email address!",
        ru: "Пожалуйста, введите правильный адрес электронной почты!"
      },
      sendSuccess: {
        az: "Mesajınız uğurla göndərildi! Tezliklə sizinlə əlaqə saxlanılacaq.",
        en: "Your message has been sent successfully! We will contact you soon.",
        ru: "Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время."
      },
      sendError: {
        az: "Mesaj göndərilərkən xəta baş verdi!",
        en: "An error occurred while sending the message!",
        ru: "Произошла ошибка при отправке сообщения!"
      },
      sending: {
        az: "Göndərilir...",
        en: "Sending...",
        ru: "Отправка..."
      }
    };
    return messages[key]?.[lang] || messages[key]?.az;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === badgeRef.current) {
              setTimeout(() => entry.target.classList.add('badge-visible'), 100);
            }
            if (entry.target === titleRef.current) {
              setTimeout(() => entry.target.classList.add('title-visible'), 200);
            }
            if (entry.target === subtitleRef.current) {
              setTimeout(() => entry.target.classList.add('subtitle-visible'), 300);
            }
            infoCardsRef.current.forEach((card, index) => {
              if (card && entry.target === card) {
                setTimeout(() => card.classList.add('card-visible'), 400 + (index * 100));
              }
            });
            if (entry.target === formRef.current) {
              setTimeout(() => entry.target.classList.add('form-visible'), 800);
            }
            if (entry.target === mapContainerRef.current) {
              setTimeout(() => entry.target.classList.add('map-visible'), 900);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (badgeRef.current) observer.observe(badgeRef.current);
    if (titleRef.current) observer.observe(titleRef.current);
    if (subtitleRef.current) observer.observe(subtitleRef.current);
    infoCardsRef.current.forEach(card => card && observer.observe(card));
    if (formRef.current) observer.observe(formRef.current);
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);

    return () => observer.disconnect();
  }, []);

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `cerez-contact-notification ${type}`;
    notification.innerHTML = `
      <div class="cerez-contact-notification-content">
        <span class="cerez-contact-notification-message">${message}</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const validateName = (name) => {
    const nameRegex = /^[A-Za-zAzərbaycanəüöğışçƏÜÖĞIŞÇ\s-]+$/;
    return nameRegex.test(name);
  };

  // Fokus olduqda +994 əlavə et (əgər boşdursa)
  const handlePhoneFocus = () => {
    if (!phoneValue || phoneValue === "") {
      setPhoneValue("+994");
    }
  };

  // Blur olduqda yalnız +994 qalıbsa təmizlə
  const handlePhoneBlur = () => {
    if (phoneValue === "+994" || phoneValue === "+994 ") {
      setPhoneValue("");
    }
  };

  // Telefon dəyişikliyi
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    setPhoneValue(value);
  };

  // Telefon validasiyası
  const validatePhoneNumber = (phone) => {
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    if (cleanPhone.startsWith('994')) {
      cleanPhone = cleanPhone.substring(3);
    }
    
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    const digitCount = cleanPhone.length;
    return digitCount >= 9 && digitCount <= 12;
  };

  // Telefon nömrəsini backend-ə göndərmək üçün standartlaşdır
  const normalizePhoneForBackend = (phone) => {
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    
    if (cleaned.startsWith('994')) {
      return `+${cleaned}`;
    }
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
      return `+994${cleaned}`;
    }
    
    if (cleaned.startsWith('+994')) {
      return cleaned;
    }
    
    if (cleaned.length >= 9 && cleaned.length <= 12) {
      return `+994${cleaned}`;
    }
    
    return phone;
  };

  // ✅ DƏYİŞDİRİLMİŞ: FORM SUBMIT - EMAİL OPTIONAL
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    const nameValue = nameRef.current?.value || "";
    const phoneValueRaw = phoneValue;
    const emailValue = emailRef.current?.value || "";
    const messageValue = messageRef.current?.value || "";
    
    // ✅ Validasiyalar - EMAİL İSTİSNA OLMAQLA!
    if (!nameValue) {
      showNotification(getLocalizedMessage('nameRequired'), "error");
      return;
    }
    
    if (!validateName(nameValue)) {
      showNotification(getLocalizedMessage('nameInvalid'), "error");
      return;
    }
    
    if (!phoneValueRaw) {
      showNotification(getLocalizedMessage('phoneRequired'), "error");
      return;
    }
    
    if (!validatePhoneNumber(phoneValueRaw)) {
      showNotification(getLocalizedMessage('phoneInvalid'), "error");
      return;
    }
    
    if (!messageValue) {
      showNotification(getLocalizedMessage('messageRequired'), "error");
      return;
    }
    
    if (messageValue.trim().length < 5) {
      showNotification(getLocalizedMessage('messageTooShort'), "error");
      return;
    }
    
    // ✅ EMAİL VALİDASİYA - YALNIZ EMAİL YAZILANDA!
    if (emailValue && emailValue.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        showNotification(getLocalizedMessage('emailInvalid'), "error");
        return;
      }
    }
    // ✅ Email boşdursa, validasiya ETMƏ və xəta GÖSTERMƏ!
    
    setIsSubmitting(true);
    
    const normalizedPhone = normalizePhoneForBackend(phoneValueRaw);
    
    const result = await sendContactMessage({
      name: nameValue,
      phone: normalizedPhone,
      email: emailValue || '', // Boş olarsa boş string göndər
      subject: `Əlaqə formu: ${nameValue}`,
      message: messageValue
    });
    
    if (result.success) {
      showNotification(getLocalizedMessage('sendSuccess'), "success");
      
      if (nameRef.current) nameRef.current.value = "";
      setPhoneValue("");
      if (phoneRef.current) phoneRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      if (messageRef.current) messageRef.current.value = "";
    } else {
      showNotification(
        result.message || getLocalizedMessage('sendError'),
        "error"
      );
    }
    
    setIsSubmitting(false);
  };

  return (
    <section className="contact-section contact-page" style={{ paddingTop: "calc(var(--nav-height) + 20px)" }} id="contact">
      <div className="contact-header">
        <div ref={badgeRef} className="contact-badge badge-hidden">{t('contact.badge')}</div>
        <h1 ref={titleRef} className="title-hidden"><Trans i18nKey="contact.title">Bizimlə <span>Əlaqə</span> Saxlayın</Trans></h1>
        <p ref={subtitleRef} className="subtitle-hidden">{t('contact.subtitle')}</p>
      </div>

      <div className="contact-cards-grid">
        <div ref={el => infoCardsRef.current[0] = el} className="info-card hover-card card-hidden">
          <div className="info-icon"><FaMapMarkerAlt /></div>
          <div><h2>{t('contact.cards.address.title')}</h2><p>{t('contact.cards.address.line1')}</p><p>{t('contact.cards.address.line2')}</p></div>
        </div>
        <div ref={el => infoCardsRef.current[1] = el} className="info-card hover-card card-hidden">
          <div className="info-icon"><FaEnvelope /></div>
          <div><h2>{t('contact.cards.email.title')}</h2><p>{t('contact.cards.email.line1')}</p><p>{t('contact.cards.email.line2')}</p></div>
        </div>
        <div ref={el => infoCardsRef.current[2] = el} className="info-card hover-card card-hidden">
          <div className="info-icon"><FaPhoneAlt /></div>
          <div><h2>{t('contact.cards.phone.title')}</h2><p>{t('contact.cards.phone.line1')}</p><p>{t('contact.cards.phone.line2')}</p></div>
        </div>
        <div ref={el => infoCardsRef.current[3] = el} className="info-card hover-card card-hidden">
          <div className="info-icon"><FaClock /></div>
          <div><h2>{t('contact.cards.hours.title')}</h2><p>{t('contact.cards.hours.line1')}</p><p>{t('contact.cards.hours.line2')}</p></div>
        </div>
      </div>

      <div className="contact-wrapper">
        <div ref={formRef} className="contact-form hover-card form-hidden">
          <h2>{t('contact.form.title')}</h2>
          <form onSubmit={handleSubmit} action="#" method="POST">
            <div className="form-row">
              <div className="form-group">
                <label>{t('contact.form.name')} <span className="required-field">*</span></label>
                <input type="text" placeholder={t('contact.form.namePlaceholder')} ref={nameRef} disabled={isSubmitting} />
              </div>
              <div className="form-group">
                <label>{t('contact.form.phone')} <span className="required-field">*</span></label>
                <input 
                  type="tel" 
                  placeholder="+994" 
                  ref={phoneRef} 
                  value={phoneValue} 
                  onChange={handlePhoneChange}
                  onFocus={handlePhoneFocus}
                  onBlur={handlePhoneBlur}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="form-group">
              <label>
                {t('contact.form.email')} 
                <span className="optional-field">({t('contact.form.optional')})</span>
              </label>
              <input 
                type="email" 
                placeholder={t('contact.form.emailPlaceholder')} 
                ref={emailRef} 
                disabled={isSubmitting} 
              />
              <small className="email-hint">{t('contact.form.emailHint')}</small>
            </div>
            <div className="form-group">
              <label>{t('contact.form.message')} <span className="required-field">*</span></label>
              <textarea 
                placeholder={t('contact.form.messagePlaceholder')} 
                ref={messageRef} 
                disabled={isSubmitting} 
                rows="5"
              />
            </div>
            <button type="submit" className="send-btn" disabled={isSubmitting}>
              {isSubmitting ? getLocalizedMessage('sending') : t('contact.form.button')}
            </button>
          </form>
        </div>

        <div ref={mapContainerRef} className="contact-map hover-card map-hidden">
          <div className="map-header"><div className="map-icon"><FaMapMarkerAlt /></div><h2>{t('contact.map.title')}</h2></div>
          <div className="map-embed">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12155.290859540348!2d49.85601568737184!3d40.390621658620276!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40307caca81c4cb1%3A0x8d9c4bfe08e61631!2sThe%20Ritz-Carlton%2C%20Baku!5e0!3m2!1saz!2saz!4v1765388722163!5m2!1saz!2saz" width="100%" height="280" style={{ border: 0, borderRadius: '10px' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Google Maps Location"></iframe>
          </div>
          <div className="map-info">
            <p>{t('contact.map.address')}</p>
            <button className="map-directions-btn" onClick={() => window.open('https://maps.google.com/?q=The+Ritz-Carlton+Baku+Azərbaycan', '_blank')}>{t('contact.map.directions')}</button>
          </div>
        </div>
      </div>
    </section>
  );
}