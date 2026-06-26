// frontend/src/components/BlogList.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { blogService } from '../services/blogService';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';
import './BlogList.css';

const BlogList = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  
  // State-lər
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [categories, setCategories] = useState(['all']);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Refs
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const cardsRef = useRef([]);

  // ✅ API-dən blogları yüklə (yalnız published statusda olanlar)
  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      const data = await blogService.getBlogs({ status: 'published' });
      setBlogs(data);
      setFilteredBlogs(data);
      
      // Kateqoriyaları və saylarını hesabla
      const uniqueCategories = ['all', ...new Set(data.map(blog => blog.category))];
      setCategories(uniqueCategories);
      
      const counts = {};
      counts['all'] = data.length;
      data.forEach(blog => {
        counts[blog.category] = (counts[blog.category] || 0) + 1;
      });
      setCategoryCounts(counts);
      
    } catch (error) {
      console.error('Bloglar yüklənərkən xəta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  // ✅ Şəkil xətası olduqda
  const handleImageError = (blogId) => {
    setImageErrors(prev => ({ ...prev, [blogId]: true }));
  };

  // Kateqoriyaya görə filtrləmə
  useEffect(() => {
    if (!isLoading && blogs.length > 0) {
      if (activeCategory === 'all') {
        setFilteredBlogs(blogs);
      } else {
        setFilteredBlogs(blogs.filter(blog => blog.category === activeCategory));
      }
      setCurrentPage(1);
    }
  }, [activeCategory, isLoading, blogs]);

  // Kateqoriya adını dilə görə tərcümə et
  const getCategoryTranslation = (category) => {
    if (category === 'all') return t('blog.categories.all');
    const categoryKey = category.toLowerCase().replace(/\s+/g, '');
    const translated = t(`blog.categories.${categoryKey}`, category);
    return translated;
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

  // Oxuma müddətini göstər
  const getReadTimeDisplay = (blog) => {
    const minutes = blog?.readTime || 5;
    return t('blog.minRead', { count: minutes });
  };

  // Təsviri göstər
  const getDescription = (blog) => {
    return blog?.description || blog?.excerpt || t('blog.defaultDescription');
  };

  // Yüklənmə animasiyası
  useEffect(() => {
    let currentProgress = 0;
    let isMounted = true;
    let intervalId = null;
    let timeoutId = null;

    if (isLoading) {
      intervalId = setInterval(() => {
        if (!isMounted) return;
        currentProgress += Math.random() * 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(intervalId);
          timeoutId = setTimeout(() => {
            if (isMounted) setIsLoading(false);
          }, 200);
        }
        setLoadingProgress(Math.min(100, Math.floor(currentProgress)));
      }, 120);

      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        clearInterval(intervalId);
        setLoadingProgress(100);
        setTimeout(() => {
          if (isMounted) setIsLoading(false);
        }, 200);
      }, 1000);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Səhifəyə hər gəlişdə scroll
  useEffect(() => {
    sessionStorage.removeItem(location.pathname);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentPage(1);
  }, [location.pathname]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  // Scroll animasiyası üçün observer
  useEffect(() => {
    if (isLoading) return;
    
    cardsRef.current.forEach(card => {
      if (card) card.classList.remove('card-visible');
    });
    
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
            if (entry.target.classList?.contains('blog-list-card')) {
              entry.target.classList.add('card-visible');
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (badgeRef.current) observer.observe(badgeRef.current);
    if (titleRef.current) observer.observe(titleRef.current);
    if (subtitleRef.current) observer.observe(subtitleRef.current);
    
    cardsRef.current.forEach(card => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [currentBlogs, currentPage, isLoading]);

  // Yüklənmə zamanı
  if (isLoading) {
    return <LoadingSpinner type="skeleton" progress={loadingProgress} />;
  }

  return (
    <div className="blog-list-container">
      <div className="blog-list-wrapper">
        <div className="blog-list-header">
          <div ref={badgeRef} className="blog-list-badge badge-hidden">
            {t('blog.badge')}
          </div>
          <h1 ref={titleRef} className="blog-list-title title-hidden">
            {t('blog.title')}<span>{t('blog.titleSuffix')}</span>
          </h1>
          <p ref={subtitleRef} className="blog-list-subtitle subtitle-hidden">
            {t('blog.subtitle')}
          </p>
        </div>

        {/* Kateqoriya Filtrləri */}
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {getCategoryTranslation(category)}
              <span className="category-count">
                {categoryCounts[category] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="blog-list-grid">
          {currentBlogs.map((blog, index) => {
            // ✅ Cloudinary URL birbaşa (API_BASE_URL əlavə etmədən)
            const imageUrl = imageErrors[blog._id] || !blog.image
              ? '/default-blog.jpg'
              : blog.image;
            
            return (
              <Link 
                to={`/blog/${blog._id}`} 
                key={blog._id} 
                className="blog-list-card card-hidden"
                ref={el => cardsRef.current[index] = el}
              >
                <div className="blog-list-card-image">
                  <img 
                    src={imageUrl}
                    alt={blog.title}
                    onError={() => handleImageError(blog._id)}
                  />
                  <span className="blog-category-badge">{getCategoryTranslation(blog.category)}</span>
                </div>
                <div className="blog-list-card-content">
                  <div className="blog-meta">
                    <span className="blog-date">
                      <i className="far fa-calendar-alt"></i>
                      {formatDate(blog.createdAt)}
                    </span>
                    <span className="blog-read-time">
                      <i className="far fa-clock"></i>
                      {getReadTimeDisplay(blog)}
                    </span>
                  </div>
                  <h3 className="blog-list-card-title">{blog.title}</h3>
                  <p className="blog-list-card-excerpt">{getDescription(blog)}</p>
                  <div className="blog-card-footer">
                    <span className="blog-views">
                      <i className="fas fa-eye"></i>
                      {blog.views || 0} {t('blog.views')}
                    </span>
                    <span className="blog-list-card-link">
                      {t('blog.readMore')} <i className="fas fa-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="no-blogs-message">
            <i className="fas fa-folder-open"></i>
            <h3>{t('blog.noArticles')}</h3>
            <p>{t('blog.selectOtherCategory')}</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default BlogList;