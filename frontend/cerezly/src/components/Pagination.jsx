import React, { useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Pagination.css';

const Pagination = ({ 
  totalPages, 
  onPageChange,
  pageParamName = 'page',
  scrollToTop = true
}) => {
  const { t } = useTranslation(); // Dil dəstəyi üçün
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isInternalUpdate = useRef(false);
  const lastProcessedPage = useRef(1);

  // URL-dən cari səhifəni oxu
  const getCurrentPageFromUrl = useCallback(() => {
    const pageParam = searchParams.get(pageParamName);
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        return page;
      }
    }
    return 1;
  }, [searchParams, pageParamName, totalPages]);

  // Güclü scroll to top funksiyası
  const forceScrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  }, []);

  // URL dəyişdikdə (brauzer irəli/geri düymələri üçün)
  useEffect(() => {
    const pageFromUrl = getCurrentPageFromUrl();
    
    // Əgər internal update-dirsə (səhifə dəyişmə düymələrindən), ignore et
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    
    // Əgər səhifə dəyişibsə və bu dəyişiklik artıq işlənməyibsə
    if (pageFromUrl !== lastProcessedPage.current && pageFromUrl !== lastProcessedPage.current) {
      lastProcessedPage.current = pageFromUrl;
      
      if (onPageChange) {
        onPageChange(pageFromUrl);
      }
      
      if (scrollToTop) {
        forceScrollToTop();
      }
    }
  }, [searchParams, getCurrentPageFromUrl, onPageChange, scrollToTop, forceScrollToTop]);

  // Səhifə dəyişdirmə funksiyası (düymələr üçün)
  const handlePageChange = useCallback((page) => {
    if (page === lastProcessedPage.current || page < 1 || page > totalPages) {
      return;
    }
    
    // Internal update olduğunu qeyd et
    isInternalUpdate.current = true;
    
    // Cari səhifəni yenilə
    lastProcessedPage.current = page;
    
    // URL-i yenilə (replace: false ilə tarixçəyə əlavə et)
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete(pageParamName);
    } else {
      newParams.set(pageParamName, page.toString());
    }
    
    const queryString = newParams.toString();
    const newUrl = queryString ? `${location.pathname}?${queryString}` : location.pathname;
    
    // navigate ilə URL-i yenilə
    navigate(newUrl, { replace: false });
    
    // Parent komponentə xəbər ver
    if (onPageChange) {
      onPageChange(page);
    }
    
    // Yuxarı scroll et
    if (scrollToTop) {
      forceScrollToTop();
    }
  }, [totalPages, searchParams, pageParamName, location.pathname, navigate, onPageChange, scrollToTop, forceScrollToTop]);

  // Səhifə nömrələrini yarat
  const getPageNumbers = useCallback(() => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const currentPageNum = lastProcessedPage.current;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPageNum <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPageNum >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPageNum - 1; i <= currentPageNum + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  }, [totalPages]);

  // Klaviatura dəstəyi
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && lastProcessedPage.current > 1) {
        handlePageChange(lastProcessedPage.current - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && lastProcessedPage.current < totalPages) {
        handlePageChange(lastProcessedPage.current + 1);
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, handlePageChange]);

  const pageNumbers = getPageNumbers();
  const currentPageNum = lastProcessedPage.current;
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="pagination-container" role="navigation" aria-label={t('pagination.ariaLabel')}>
      <button 
        onClick={() => handlePageChange(1)} 
        disabled={currentPageNum === 1}
        className="pagination-btn pagination-first"
        title={t('pagination.firstTitle')}
      >
        <span className="btn-icon">«</span>
        <span className="btn-text">{t('pagination.first')}</span>
      </button>
      
      <button 
        onClick={() => handlePageChange(currentPageNum - 1)} 
        disabled={currentPageNum === 1}
        className="pagination-btn pagination-prev"
        title={t('pagination.prevTitle')}
      >
        <span className="btn-icon">‹</span>
        <span className="btn-text">{t('pagination.prev')}</span>
      </button>
      
      <div className="pagination-numbers">
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="pagination-dots">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-number ${currentPageNum === page ? 'active' : ''}`}
              aria-label={t('pagination.goToPage', { page })}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <button 
        onClick={() => handlePageChange(currentPageNum + 1)} 
        disabled={currentPageNum === totalPages}
        className="pagination-btn pagination-next"
        title={t('pagination.nextTitle')}
      >
        <span className="btn-text">{t('pagination.next')}</span>
        <span className="btn-icon">›</span>
      </button>
      
      <button 
        onClick={() => handlePageChange(totalPages)} 
        disabled={currentPageNum === totalPages}
        className="pagination-btn pagination-last"
        title={t('pagination.lastTitle')}
      >
        <span className="btn-text">{t('pagination.last')}</span>
        <span className="btn-icon">»</span>
      </button>
      
      <div className="pagination-info">
        {t('pagination.pageInfo', { current: currentPageNum, total: totalPages })}
      </div>
    </div>
  );
};

export default Pagination;