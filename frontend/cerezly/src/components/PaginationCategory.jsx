// PaginationCategory.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './Pagination.css';

const PaginationCategory = ({ 
  totalPages, 
  currentPage, 
  onPageChange
}) => {
  const { t } = useTranslation();

  const handlePageChange = (page) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="pagination-container" role="navigation" aria-label={t('pagination.ariaLabel')}>
      <button 
        onClick={() => handlePageChange(1)} 
        disabled={currentPage === 1}
        className="pagination-btn pagination-first"
        title={t('pagination.firstTitle')}
      >
        <span className="btn-icon">«</span>
        <span className="btn-text">{t('pagination.first')}</span>
      </button>
      
      <button 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}
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
              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              aria-label={t('pagination.goToPage', { page })}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <button 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="pagination-btn pagination-next"
        title={t('pagination.nextTitle')}
      >
        <span className="btn-text">{t('pagination.next')}</span>
        <span className="btn-icon">›</span>
      </button>
      
      <button 
        onClick={() => handlePageChange(totalPages)} 
        disabled={currentPage === totalPages}
        className="pagination-btn pagination-last"
        title={t('pagination.lastTitle')}
      >
        <span className="btn-text">{t('pagination.last')}</span>
        <span className="btn-icon">»</span>
      </button>
      
      <div className="pagination-info">
        {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
      </div>
    </div>
  );
};

export default PaginationCategory;