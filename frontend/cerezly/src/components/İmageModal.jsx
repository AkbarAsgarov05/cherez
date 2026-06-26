import React, { useEffect } from 'react';
import './İmageModal.css';

const ImageModal = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onNext, 
  onPrev,
  titles 
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const currentTitle = titles[currentIndex] || '';

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>
        
        <button className="modal-nav-btn modal-prev-btn" onClick={onPrev}>
          ‹
        </button>
        
        <div className="modal-image-container">
          {currentImage ? (
            <img 
              src={currentImage} 
              alt={currentTitle} 
              className="modal-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="200" y="150" font-family="Arial" font-size="16" text-anchor="middle" fill="%23999">Şəkil yüklənmədi</text></svg>';
              }}
            />
          ) : (
            <div className="modal-no-image">
              Şəkil yoxdur
            </div>
          )}
          
          {currentTitle && (
            <div className="modal-image-title">{currentTitle}</div>
          )}
          
          <div className="modal-image-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
        
        <button className="modal-nav-btn modal-next-btn" onClick={onNext}>
          ›
        </button>
        
        {/* Mobile swipe üçün */}
        <div 
          className="modal-swipe-area left" 
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        />
        <div 
          className="modal-swipe-area right" 
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        />
      </div>
    </div>
  );
};

export default ImageModal;