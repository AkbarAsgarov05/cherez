import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiShare2,
  FiCalendar
} from 'react-icons/fi';
import { FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import './CampaignDetail.css';

const CampaignDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // PROXY URL FUNKSİYASI
  const getProxyUrl = (cloudinaryUrl) => {
    if (!cloudinaryUrl) return null;
    
    if (cloudinaryUrl.includes('/api/uploads/')) {
      return cloudinaryUrl;
    }
    
    if (cloudinaryUrl.includes('default-campaign')) {
      return cloudinaryUrl;
    }
    
    try {
      let filename = null;
      
      const campaignsMatch = cloudinaryUrl.match(/\/campaigns\/([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
      if (campaignsMatch) {
        filename = campaignsMatch[1];
      }
      
      if (!filename) {
        const fileMatch = cloudinaryUrl.match(/\/([^\/]+\.(jpg|jpeg|png|gif|webp))$/i);
        if (fileMatch) {
          filename = fileMatch[1];
        }
      }
      
      if (filename) {
        return `${API_URL}/uploads/campaign-image/${encodeURIComponent(filename)}`;
      }
      
      return '/images/default-campaign.jpg';
      
    } catch (error) {
      console.error('Proxy URL xətası:', error);
      return '/images/default-campaign.jpg';
    }
  };

  // ✅ DÜZƏLDİLDİ - Kampaniya məlumatlarını /all endpoint-indən çək (bitmişlər də daxil)
  useEffect(() => {
    const fetchCampaign = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Əvvəlcə bütün kampaniyaları çək (bitmişlər də daxil)
        const response = await fetch(`${API_URL}/campaigns/all`);
        
        if (!response.ok) {
          throw new Error('Kampaniyalar yüklənə bilmədi');
        }
        
        const data = await response.json();
        const campaigns = data.campaigns || [];
        
        // ID-ə uyğun kampaniyanı tap
        const foundCampaign = campaigns.find(c => c._id === id);
        
        if (!foundCampaign) {
          setError('NOT_FOUND');
          return;
        }
        
        // Banner URL-ni proxy-ə çevir
        if (foundCampaign.banner) {
          foundCampaign.banner = getProxyUrl(foundCampaign.banner);
        }
        
        setCampaign(foundCampaign);
      } catch (error) {
        console.error('Xəta:', error);
        setError('SERVER_ERROR');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  // Səhifəyə girişdə tam yuxarıya scroll et
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [id]);

  // Tarixi formatla
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  // Kampaniyanın aktiv olub olmadığını yoxla
  const isCampaignActive = () => {
    if (!campaign) return false;
    const today = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    // API-dən gələn isActive dəyərini istifadə et, yoxsa özümüz hesablayaq
    if (campaign.isActive !== undefined) {
      return campaign.isActive === true;
    }
    return campaign.status === 'active' && today >= start && today <= end;
  };

  // Şəkil xətası olduqda default şəkil göstər
  const handleImageError = () => {
    setImageError(true);
  };

  // Təhlükəsiz kopyalama funksiyası
  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Clipboard API xətası:', err);
      }
    }
    
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      console.error('Fallback copy xətası:', err);
      return false;
    }
  };

  // Sosial media paylaşım funksiyaları
  const shareOnSocial = async (platform) => {
    const url = window.location.href;
    const title = campaign?.name || '';
    
    switch (platform) {
      case 'facebook':
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        break;
        
      case 'instagram':
        const instagramText = `${title}\n${url}`;
        const instaSuccess = await copyToClipboard(instagramText);
        if (instaSuccess) {
          toast.success(t('campaigns.toast.linkCopiedInstagram') || '✅ Link kopyalandı! Instagram-da paylaşa bilərsiniz.', {
            duration: 3000,
            position: 'top-right',
          });
        } else {
          toast.error(t('campaigns.toast.copyFailed') || '❌ Link kopyalana bilmədi.', {
            duration: 3000,
            position: 'top-right',
          });
        }
        break;
        
      case 'tiktok':
        const tiktokText = `${title}\n${url}`;
        const tiktokSuccess = await copyToClipboard(tiktokText);
        if (tiktokSuccess) {
          toast.success(t('campaigns.toast.linkCopiedTikTok') || '✅ Link kopyalandı! TikTok-da paylaşa bilərsiniz.', {
            duration: 3000,
            position: 'top-right',
          });
        } else {
          toast.error(t('campaigns.toast.copyFailed') || '❌ Link kopyalana bilmədi.', {
            duration: 3000,
            position: 'top-right',
          });
        }
        break;
        
      case 'x':
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        window.open(xUrl, '_blank', 'width=600,height=400');
        break;
        
      case 'linkedin':
        const description = encodeURIComponent(campaign?.description?.substring(0, 100) || '');
        const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${description}`;
        window.open(linkedinUrl, '_blank', 'width=600,height=400');
        break;
        
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title)}%20-%20${encodeURIComponent(url)}`;
        window.open(whatsappUrl, '_blank');
        break;
        
      default:
        break;
    }
  };

  // YÜKLƏNMƏ ZAMANI
  if (isLoading) {
    return (
      <div className="campaign-detail-loading">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <p className="loading-title">{t('common.loading') || t('campaigns.loading.title') || 'Yüklənir'}</p>
            <p className="loading-subtitle">{t('campaigns.loading.subtitle') || 'Zəhmət olmasa, gözləyin...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Kampaniya tapılmadıqda
  if (error === 'NOT_FOUND' || !campaign) {
    return (
      <div className="campaign-detail-not-found">
        <div className="campaign-detail-not-found-content">
          <h2>{t('campaigns.notFound')}</h2>
          <p>{t('campaigns.notFoundDesc')}</p>
          <button onClick={() => navigate('/kampaniyalar')} className="campaign-detail-back-btn">
            {t('campaigns.allCampaigns')}
          </button>
        </div>
      </div>
    );
  }

  const isActive = isCampaignActive();
  const discountDisplay = campaign.discountType === 'percentage' 
    ? `${campaign.discountValue}% ${t('campaigns.discount') || 'Endirim'}`
    : `${campaign.discountValue} AZN ${t('campaigns.discount') || 'Endirim'}`;

  // Şəkil URL-i (xəta varsa default)
  const bannerUrl = imageError || !campaign.banner 
    ? '/images/default-campaign.jpg' 
    : campaign.banner;

  return (
    <div className="campaign-detail-container">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="campaign-detail-back">
        <button onClick={() => navigate('/kampaniyalar')} className="campaign-detail-back-button">
          ← {t('campaigns.allCampaigns')}
        </button>
      </div>

      <div className="campaign-detail-card">
        <h1 className="campaign-detail-title">{campaign.name}</h1>

        <div className="campaign-detail-image">
          <img 
            src={bannerUrl}
            alt={campaign.name}
            onError={handleImageError}
          />
          <span className="campaign-detail-badge discount-detail-badge">
            {discountDisplay}
          </span>
          {!isActive && (
            <span className="campaign-expired-badge">{t('campaigns.expired')}</span>
          )}
          {campaign.promoCode && isActive && (
            <span className="campaign-promo-badge">
              KOD: {campaign.promoCode}
            </span>
          )}
        </div>

        <div className="campaign-detail-description">
          <p>{campaign.description}</p>
          
          <div className="campaign-detail-dates">
            <div className="date-item">
              <div className="date-icon">
                <FiCalendar />
              </div>
              <div className="date-info">
                <span className="date-label">{t('campaigns.startDate')}:</span>
                <span className="date-value">{formatDate(campaign.startDate)}</span>
              </div>
            </div>
            <div className="date-item">
              <div className="date-icon">
                <FiCalendar />
              </div>
              <div className="date-info">
                <span className="date-label">{t('campaigns.endDate')}:</span>
                <span className="date-value">{formatDate(campaign.endDate)}</span>
              </div>
            </div>
            <div className={`campaign-status-badge ${isActive ? 'active' : 'expired'}`}>
              <i className="status-icon">●</i>
              {isActive ? t('campaigns.active') : t('campaigns.expiredStatus')}
            </div>
          </div>
        </div>

        {/* Sosial media paylaşım */}
        <div className="campaign-detail-social">
          <h3 className="social-share-title">{t('campaigns.shareTitle')}</h3>
          <div className="social-share-icons">
            <button 
              className="social-share-btn instagram-share" 
              aria-label="Instagram-da paylaş"
              onClick={() => shareOnSocial('instagram')}
            >
              <FiInstagram />
              <div className="social-share-gradient"></div>
            </button>

            <button 
              className="social-share-btn facebook-share" 
              aria-label="Facebook-da paylaş"
              onClick={() => shareOnSocial('facebook')}
            >
              <FiFacebook />
              <div className="social-share-gradient"></div>
            </button>

            <button 
              className="social-share-btn tiktok-share" 
              aria-label="TikTok-da paylaş"
              onClick={() => shareOnSocial('tiktok')}
            >
              <FaTiktok />
              <div className="social-share-gradient"></div>
            </button>

            <button 
              className="social-share-btn whatsapp-share" 
              aria-label="WhatsApp-da paylaş"
              onClick={() => shareOnSocial('whatsapp')}
            >
              <FaWhatsapp />
              <div className="social-share-gradient"></div>
            </button>

            <button 
              className="social-share-btn x-share" 
              aria-label="X-də paylaş"
              onClick={() => shareOnSocial('x')}
            >
              <SiX />
              <div className="social-share-gradient"></div>
            </button>

            <button 
              className="social-share-btn linkedin-share" 
              aria-label="LinkedIn-də paylaş"
              onClick={() => shareOnSocial('linkedin')}
            >
              <FiLinkedin />
              <div className="social-share-gradient"></div>
            </button>
          </div>
          <p className="social-share-note">
            <FiShare2 className="share-note-icon" />
            {t('campaigns.shareNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;