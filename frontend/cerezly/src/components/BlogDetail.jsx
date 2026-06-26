// frontend/src/components/BlogDetail.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { blogService } from '../services/blogService';
import { 
  FiShare2, 
  FiCalendar, 
  FiClock, 
  FiEye, 
  FiArrowLeft,
  FiHeart,
  FiBookmark
} from 'react-icons/fi';
import './BlogDetail.css';

const BlogDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef(null);

  // Blog məlumatlarını yüklə
  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await blogService.getBlogById(id);
        setBlog(data);
      } catch (err) {
        console.error('Xəta:', err);
        setError('NOT_FOUND');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadBlog();
    }
  }, [id]);

  // Scroll sıfırlama
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [id]);

  // Kateqoriya adını dilə uyğun tərcümə et
  const getCategoryTranslation = (category) => {
    if (!category) return '';
    const categoryKey = category.toLowerCase().replace(/\s+/g, '');
    const translated = t(`blog.categories.${categoryKey}`, category);
    return translated;
  };

  // Oxuma müddətini göstər
  const getReadTimeDisplay = () => {
    const minutes = blog?.readTime || 5;
    return t('blog.minRead', { count: minutes });
  };

  // Tarixi formatla
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const currentLang = i18n.language;
    const date = new Date(dateString);
    
    const months = {
      az: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      ru: ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря']
    };
    
    const monthIndex = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();
    const monthName = months[currentLang]?.[monthIndex] || months.en[monthIndex];
    
    if (currentLang === 'az') {
      return `${day} ${monthName} ${year}`;
    } else if (currentLang === 'en') {
      return `${monthName} ${day}, ${year}`;
    } else {
      return `${day} ${monthName} ${year}`;
    }
  };

  // Təsviri göstər
  const getDescription = () => {
    return blog?.description || blog?.excerpt || t('blog.defaultDescription');
  };

  // ✅ Şəkil xətası olduqda
  const handleImageError = () => {
    setImageError(true);
  };

  // Məzmunu render et
  const renderContent = () => {
    if (!blog?.content) {
      return <p>{t('blog.noContent')}</p>;
    }
    
    const paragraphs = blog.content.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      if (paragraph.startsWith('# ')) {
        return <h1 key={index}>{paragraph.substring(2)}</h1>;
      }
      if (paragraph.startsWith('## ')) {
        return <h2 key={index}>{paragraph.substring(3)}</h2>;
      }
      if (paragraph.startsWith('### ')) {
        return <h3 key={index}>{paragraph.substring(4)}</h3>;
      }
      return <p key={index}>{paragraph}</p>;
    });
  };

  // Toast mesajı
  const showToast = (messageKey, isError = false) => {
    const message = t(messageKey);
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isError ? '#dc2626' : 'rgba(0, 0, 0, 0.85)'};
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 14px;
      z-index: 10000;
      white-space: nowrap;
      font-family: system-ui, -apple-system, sans-serif;
      animation: toastFadeInOut 2.5s ease forwards;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast?.remove) toast.remove();
    }, 2500);
  };

  // Kopyalama funksiyası
  const copyToClipboard = async (text, successBtn, modalOverlay) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showCopySuccess(successBtn, modalOverlay);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (success) {
          showCopySuccess(successBtn, modalOverlay);
        } else {
          throw new Error('execCommand copy failed');
        }
      }
    } catch (err) {
      console.error('Kopyalama xətası:', err);
      successBtn.textContent = `❌ ${t('blog.copyError')}`;
      successBtn.style.background = '#dc2626';
      setTimeout(() => {
        if (modalOverlay && modalOverlay.remove) modalOverlay.remove();
      }, 1500);
    }
  };

  const showCopySuccess = (btn, modalOverlay) => {
    btn.textContent = `✓ ${t('blog.copied')}`;
    btn.style.background = '#2e7d32';
    setTimeout(() => {
      if (modalOverlay && modalOverlay.remove) modalOverlay.remove();
    }, 1200);
  };

  // Paylaş funksiyası
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = blog?.title || t('blog.shareTitle');
    const shareText = getDescription();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        showFallbackShareModal(shareUrl);
      }
    } else {
      showFallbackShareModal(shareUrl);
    }
  };

  // Fallback paylaşım modalı
  const showFallbackShareModal = (url) => {
    const existingModal = document.querySelector('.share-modal-overlay');
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'share-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: modalFadeIn 0.2s ease;
    `;
    
    overlay.innerHTML = `
      <div class="share-modal-content" style="
        background: white;
        border-radius: 28px;
        max-width: 340px;
        width: 85%;
        padding: 28px 24px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        ">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #1a202c;">${t('blog.shareLinkTitle')}</h3>
        <p style="margin: 0 0 20px 0; color: #718096; font-size: 14px; line-height: 1.5;">${t('blog.shareLinkDesc')}</p>
        <div style="
          background: #f7fafc;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 24px;
          word-break: break-all;
          font-size: 13px;
          color: #2d3748;
          border: 1px solid #e2e8f0;
          font-family: monospace;
        ">${url}</div>
        <div style="display: flex; gap: 12px;">
          <button id="copyLinkBtn" style="
            flex: 1;
            background: linear-gradient(135deg, #c58828, #ad721f);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 40px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          ">${t('blog.copyLink')}</button>
          <button id="closeModalBtn" style="
            flex: 1;
            background: #f1f3f5;
            color: #4a5568;
            border: none;
            padding: 14px;
            border-radius: 40px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          ">${t('blog.close')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const copyBtn = overlay.querySelector('#copyLinkBtn');
    const closeBtn = overlay.querySelector('#closeModalBtn');
    
    copyBtn.onclick = () => {
      copyToClipboard(url, copyBtn, overlay);
    };
    
    closeBtn.onclick = () => {
      overlay.remove();
    };
    
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    showToast(isBookmarked ? 'blog.removedFromBookmarks' : 'blog.addedToBookmarks');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) showToast('blog.liked');
  };

  // ✅ Şəkil URL-i (Cloudinary birbaşa, xəta varsa default)
  const imageUrl = imageError || !blog?.image
    ? '/images/blog/default.jpg'
    : blog.image;

  // LOADING STATE
  if (loading) {
    return (
      <div className="blog-detail-container">
        <div className="blog-detail-wrapper">
          <div className="blog-detail-loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">{t('blog.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error === 'NOT_FOUND' || !blog) {
    return (
      <div className="blog-detail-not-found">
        <div className="blog-detail-not-found-content">
          <div className="not-found-icon">
            <i className="fas fa-search"></i>
          </div>
          <h2>{t('blog.notFound')}</h2>
          <p>{t('blog.notFoundDesc')}</p>
          <button onClick={() => navigate('/blog')} className="blog-detail-back-btn">
            <FiArrowLeft /> {t('blog.allArticles')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-detail-container" ref={containerRef}>
      <div className="blog-detail-wrapper">
        {/* Geri düyməsi */}
        <div className="blog-detail-back">
          <button onClick={() => navigate('/blog')} className="blog-detail-back-button">
            <FiArrowLeft /> {t('blog.allArticles')}
          </button>
        </div>

        {/* Məqalə kartı */}
        <article className="blog-detail-card">
          {/* ✅ Şəkil və kateqoriya - Cloudinary URL birbaşa */}
          <div className="blog-detail-image">
            <img 
              src={imageUrl}
              alt={blog.title}
              onError={handleImageError}
            />
            <span className="blog-detail-category">{getCategoryTranslation(blog.category)}</span>
          </div>

          {/* Məzmun */}
          <div className="blog-detail-content">
            {/* Meta məlumatlar */}
            <div className="blog-detail-meta">
              <div className="meta-left">
                <span className="blog-detail-date">
                  <FiCalendar /> {formatDate(blog.createdAt)}
                </span>
                <span className="blog-detail-read-time">
                  <FiClock /> {getReadTimeDisplay()}
                </span>
                <span className="blog-detail-views">
                  <FiEye /> {blog.views || 0} {t('blog.views')}
                </span>
              </div>
              <div className="meta-right">
                <button 
                  className={`meta-btn bookmark-btn ${isBookmarked ? 'active' : ''}`}
                  onClick={handleBookmark}
                  title={isBookmarked ? t('blog.removeFromBookmarks') : t('blog.addToBookmarks')}
                >
                  <FiBookmark />
                </button>
                <button 
                  className={`meta-btn like-btn ${isLiked ? 'active' : ''}`}
                  onClick={handleLike}
                  title={t('blog.like')}
                >
                  <FiHeart />
                </button>
                <button 
                  className="meta-btn share-btn"
                  onClick={handleShare}
                  title={t('blog.share')}
                >
                  <FiShare2 />
                </button>
              </div>
            </div>

            {/* Başlıq */}
            <h1 className="blog-detail-title">{blog.title}</h1>

            {/* Xülasə */}
            <div className="blog-detail-excerpt">
              <p>{getDescription()}</p>
            </div>

            {/* Tam məzmun */}
            <div className="blog-detail-full-content">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="blog-detail-footer">
              <div className="footer-tags">
                <span className="tag-label">{t('blog.category')}:</span>
                <span className="tag">{getCategoryTranslation(blog.category)}</span>
              </div>
              <div className="footer-share">
                <button className="share-button" onClick={handleShare}>
                  <FiShare2 /> {t('blog.share')}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetail;