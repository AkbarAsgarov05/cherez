// src/components/LoadingSpinner.jsx
import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'large', 
  type = 'full', 
  progress = null,
  minHeight = '100vh' 
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Progress dəyərini idarə et
  useEffect(() => {
    if (progress !== null && !isNaN(progress) && isFinite(progress)) {
      setDisplayProgress(Math.min(100, Math.max(0, Math.floor(progress))));
    } else {
      setDisplayProgress(0);
    }
  }, [progress]);

  // Ölçülər
  const sizes = {
    small: { width: 40, height: 40, fontSize: 20, borderWidth: 3 },
    medium: { width: 60, height: 60, fontSize: 28, borderWidth: 4 },
    large: { width: 80, height: 80, fontSize: 36, borderWidth: 5 },
    xlarge: { width: 100, height: 100, fontSize: 44, borderWidth: 6 }
  };

  const currentSize = sizes[size] || sizes.large;

  // Sadə spinner (inline üçün)
  if (type === 'inline') {
    return (
      <div className="loading-inline">
        <div className="loading-spinner-inline"></div>
        <span className="loading-inline-text">Yüklənir...</span>
      </div>
    );
  }

  // Skeleton loader (kartlar üçün)
  if (type === 'skeleton') {
    return (
      <div className="loading-skeleton-container" style={{ minHeight }}>
        <div className="skeleton-header">
          <div className="skeleton-badge"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
        <div className="skeleton-filters">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-filter-btn"></div>
          ))}
        </div>
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-meta">
                  <span></span>
                  <span></span>
                </div>
                <div className="skeleton-title-sm"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-footer">
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tam səhifə yüklənməsi
  return (
    <div className="loading-container" style={{ minHeight }}>
      <div className="loading-content">
        {/* Aydın qırıq xətli fırlanan çevrə */}
        <div className="loading-circle-wrapper">
          <div 
            className="loading-circle"
            style={{
              width: currentSize.width,
              height: currentSize.height
            }}
          >
            <div className="loading-circle-border"></div>
            <div className="loading-circle-inner">
              <span 
                className="loading-circle-letter"
                style={{ fontSize: currentSize.fontSize }}
              >
                Ç
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="loading-progress-wrapper">
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill" 
                style={{ width: `${displayProgress}%` }}
              />
            </div>
            <div className="loading-progress-text">
              <span>{displayProgress}%</span>
            </div>
          </div>
        )}

        {/* Sabit mesaj */}
        <p className="loading-message">
          Səhifə hazırlanır
          <span className="loading-dots">...</span>
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;