import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';
import './CampaignsList.css';

const CampaignsList = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // State-lər
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  
  const itemsPerPage = 9;
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const cardsRef = useRef([]);

  // API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // ✅ PROXY URL FUNKSİYASI - Cloudinary şəkillərini backend proxy ilə qaytar
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
      
      return cloudinaryUrl;
      
    } catch (error) {
      console.error('Proxy URL xətası:', error);
      return cloudinaryUrl;
    }
  };

  // ✅ DƏYİŞDİRİLDİ - Kampaniyaları API-dən çək (BÜTÜN kampaniyalar - aktiv və bitmiş)
  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      // /active əvəzinə /all endpoint-i istifadə olunur
      const response = await fetch(`${API_URL}/campaigns/all`);
      
      if (!response.ok) {
        throw new Error('Kampaniyalar yüklənə bilmədi');
      }
      
      const data = await response.json();
      const allCampaigns = data.campaigns || [];
      
      // ✅ Hər kampaniyanın banner URL-ni proxy-ə çevir
      const processedCampaigns = allCampaigns.map(campaign => ({
        ...campaign,
        banner: campaign.banner ? getProxyUrl(campaign.banner) : null
      }));
      
      setCampaigns(processedCampaigns);
      setTotalCampaigns(processedCampaigns.length);
      setTotalPages(Math.ceil(processedCampaigns.length / itemsPerPage));
    } catch (error) {
      console.error('Xəta:', error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Səhifəyə hər gəlişdə scroll mövqeyini sıfırla
  useEffect(() => {
    sessionStorage.removeItem(location.pathname);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentPage(1);
  }, [location.pathname]);

  // Şəkil xətası olduqda default şəkil göstər
  const handleImageError = (campaignId) => {
    setImageErrors(prev => ({ ...prev, [campaignId]: true }));
  };

  // Scroll animasiyası üçün observer
  useEffect(() => {
    if (isLoading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === badgeRef.current) {
              entry.target.classList.add('badge-visible');
            }
            if (entry.target === titleRef.current) {
              entry.target.classList.add('title-visible');
            }
            if (entry.target === subtitleRef.current) {
              entry.target.classList.add('subtitle-visible');
            }
            cardsRef.current.forEach((card, index) => {
              if (card && entry.target === card) {
                setTimeout(() => card.classList.add('card-visible'), index * 100);
              }
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (badgeRef.current) observer.observe(badgeRef.current);
    if (titleRef.current) observer.observe(titleRef.current);
    if (subtitleRef.current) observer.observe(subtitleRef.current);
    cardsRef.current.forEach(card => card && observer.observe(card));

    return () => observer.disconnect();
  }, [currentPage, isLoading, campaigns]);

  // Pagination üçün cari səhifədə göstəriləcək kampaniyalar
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCampaigns = campaigns.slice(indexOfFirstItem, indexOfLastItem);

  // Səhifə dəyişdikdə yuxarı scroll et
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  // Yüklənmə zamanı göstər
  if (isLoading) {
    return <LoadingSpinner type="skeleton" progress={0} />;
  }

  return (
    <div className="campaigns-list-container">
      <div className="campaigns-list-wrapper">
        <div className="campaigns-list-header">
          <div ref={badgeRef} className="campaigns-list-badge badge-hidden">
            {t('campaigns.badge')}
          </div>
          <h1 ref={titleRef} className="campaigns-list-title title-hidden">
            {t('campaigns.title')}<span>{t('campaigns.titleSuffix')}</span>
          </h1>
          <p ref={subtitleRef} className="campaigns-list-subtitle subtitle-hidden">
            {t('campaigns.subtitle')}
          </p>
        </div>

        {campaigns.length === 0 ? (
          <div className="no-campaigns-message">
            <div className="empty-icon">
              <i className="fas fa-gift"></i>
            </div>
            <h3>{t('campaigns.noActiveCampaigns') || 'Hazırda kampaniya yoxdur'}</h3>
            <p>{t('campaigns.noActiveCampaignsDesc') || 'Yeni kampaniyalar üçün bizi izləməyə davam edin!'}</p>
            <div className="suggestion-box">
              <p>
                <i className="fas fa-bell"></i> 
                {t('campaigns.noActiveCampaignsSuggestion') || 'Ən yeni endirimlərdən ilk siz xəbərdar olun!'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="campaigns-list-grid">
              {currentCampaigns.map((campaign, index) => {
                // Şəkil URL-i (xəta varsa default)
                const bannerUrl = imageErrors[campaign._id] || !campaign.banner
                  ? '/images/default-campaign.jpg'
                  : campaign.banner;
                
                // ✅ Kampaniyanın bitdiyini yoxla
                const isExpired = campaign.isExpired === true || campaign.status === 'completed';
                
                return (
                  <Link 
                    to={`/kampaniya/${campaign._id}`} 
                    key={campaign._id} 
                    className={`campaign-list-card card-hidden ${isExpired ? 'expired-card' : ''}`}
                    ref={el => cardsRef.current[index] = el}
                  >
                    <div className="campaign-list-card-image">
                      <img 
                        src={bannerUrl}
                        alt={campaign.name}
                        onError={() => handleImageError(campaign._id)}
                      />
                      <span className="campaign-list-badge discount-badge">
                        {campaign.discountType === 'percentage' 
                          ? `${campaign.discountValue}% ${t('campaigns.discount') || 'Endirim'}`
                          : `${campaign.discountValue} AZN ${t('campaigns.discount') || 'Endirim'}`}
                      </span>
                      {/* ✅ Bitmiş kampaniya badge'i */}
                      {isExpired && (
                        <span className="expired-card-badge">
                          <i className="fas fa-check-circle"></i> Bitmiş
                        </span>
                      )}
                    </div>
                    <div className="campaign-list-card-content">
                      <h3 className="campaign-list-card-title">{campaign.name}</h3>
                      <span className="campaign-list-card-link">
                        {t('campaigns.readMore') || 'Ətraflı'} →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignsList;