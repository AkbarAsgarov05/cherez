// src/hooks/useLoading.js
import { useState, useEffect, useCallback, useRef } from 'react';

const useLoading = (initialState = true, minDelay = 500) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Yüklənməyə başla
  const startLoading = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    
    // Progress avtomatik artımı (opsiyonel)
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const elapsed = Date.now() - (startTimeRef.current || Date.now());
        const calculatedProgress = Math.min(90, (elapsed / 3000) * 100);
        return Math.max(prev, calculatedProgress);
      });
    }, 100);
  }, []);

  // Yüklənməni bitir
  const stopLoading = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const remainingDelay = Math.max(0, minDelay - elapsed);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setProgress(100);
      startTimeRef.current = null;
    }, remainingDelay);
    
    return () => clearTimeout(timer);
  }, [minDelay]);

  // Progress-i manual yenilə
  const updateProgress = useCallback((value) => {
    setProgress(prev => Math.min(100, Math.max(prev, value)));
  }, []);

  // Komponent unmount olduqda təmizlə
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Yüklənməni sıfırla
  const resetLoading = useCallback(() => {
    setIsLoading(initialState);
    setProgress(0);
    startTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [initialState]);

  return {
    isLoading,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
    resetLoading,
    setLoading: setIsLoading,
    setProgress
  };
};

export default useLoading;