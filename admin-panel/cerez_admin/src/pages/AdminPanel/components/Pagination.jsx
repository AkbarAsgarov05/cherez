// src/components/AdminPanel/components/Pagination.jsx
import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  pageParamName = 'page',
  scrollToTop = true
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInternalUpdate = useRef(false);

  // Güclü scroll to top funksiyası - BİR NEÇƏ DƏFƏ ÇAĞIRILIR
  const forceScrollToTop = () => {
    // 1. Dərhal scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // 2. Bütün scroll edilə bilən elementləri təmizlə
    const scrollableElements = document.querySelectorAll('*');
    scrollableElements.forEach(el => {
      if (el.scrollTop > 0) {
        el.scrollTop = 0;
      }
    });
    
    // 3. Smooth scroll ilə təkrar (50ms sonra)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    // 4. Bir daha təhlükəsizlik üçün (100ms sonra)
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    
    // 5. Son bir dəfə (200ms sonra)
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 200);
  };

  // URL-dən səhifə nömrəsini oxu
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    
    const pageFromUrl = searchParams.get(pageParamName);
    if (pageFromUrl) {
      const pageNum = parseInt(pageFromUrl, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
        onPageChange(pageNum);
        if (scrollToTop) {
          forceScrollToTop();
        }
      }
    } else {
      if (currentPage !== 1) {
        onPageChange(1);
        if (scrollToTop) {
          forceScrollToTop();
        }
      }
    }
  }, [searchParams]);

  // Səhifə dəyişdirmə
  const handlePageChange = (page) => {
    if (page === currentPage || page < 1 || page > totalPages) {
      return;
    }
    
    isInternalUpdate.current = true;
    
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete(pageParamName);
    } else {
      newParams.set(pageParamName, page.toString());
    }
    setSearchParams(newParams, { replace: false });
    
    onPageChange(page);
    
    if (scrollToTop) {
      forceScrollToTop();
    }
  };

  // Səhifə nömrələrini yarat
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="admin-pagination">
      <button 
        onClick={() => handlePageChange(1)} 
        disabled={currentPage === 1}
        className="admin-pagination-btn admin-first-page"
        title="İlk səhifə"
      >
        <span className="admin-btn-icon">«</span>
        <span className="admin-btn-text">İlk</span>
      </button>
      
      <button 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className="admin-pagination-btn admin-prev-page"
        title="Əvvəlki səhifə"
      >
        <span className="admin-btn-icon">‹</span>
        <span className="admin-btn-text">Əvvəl</span>
      </button>
      
      {pageNumbers.map((page, index) => (
        page === '...' ? (
          <span key={`dots-${index}`} className="admin-pagination-dots">...</span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`admin-pagination-btn admin-page-number ${currentPage === page ? 'admin-active' : ''}`}
          >
            {page}
          </button>
        )
      ))}
      
      <button 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="admin-pagination-btn admin-next-page"
        title="Sonrakı səhifə"
      >
        <span className="admin-btn-text">Sonra</span>
        <span className="admin-btn-icon">›</span>
      </button>
      
      <button 
        onClick={() => handlePageChange(totalPages)} 
        disabled={currentPage === totalPages}
        className="admin-pagination-btn admin-last-page"
        title="Son səhifə"
      >
        <span className="admin-btn-text">Son</span>
        <span className="admin-btn-icon">»</span>
      </button>
      
      <div className="admin-pagination-info">
        Səhifə {currentPage} / {totalPages}
      </div>
    </div>
  );
};

export default Pagination;