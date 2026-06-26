import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './WhatsAppButton.css';

const WhatsAppButton = () => {
  const { t } = useTranslation();
  
  const phoneNumber = '9940508544914';
  
  // ✅ Hazır mesaj silindi - yalnız telefon nömrəsi ilə link
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  return (
    <a
      href={whatsappUrl}
      className="whatsapp-button"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp.ariaLabel', 'WhatsApp ilə əlaqə')}
    >
      <div className="whatsapp-rings">
        <div className="whatsapp-ring whatsapp-ring-1"></div>
        <div className="whatsapp-ring whatsapp-ring-2"></div>
        <div className="whatsapp-ring whatsapp-ring-3"></div>
      </div>
      
      <FaWhatsapp className="whatsapp-icon" />
      
      <div className="whatsapp-text-container">
        <span className="whatsapp-text">{t('whatsapp.text', 'Bizimlə danışın')}</span>
      </div>
    </a>
  );
};

export default WhatsAppButton;