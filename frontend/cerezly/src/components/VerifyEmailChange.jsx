import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmailChange = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    console.log('🔍 URL-dən alınan token:', token);
    
    if (!token) {
      setStatus('error');
      setMessage('Token tapılmadı');
      return;
    }
    
    // ✅ DÜZGÜN URL - SİZİN BACKEND ÜNVANINIZ
    fetch(`http://192.168.1.72:5000/api/auth/verify-email-change?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(async res => {
        console.log('📥 Cavab statusu:', res.status);
        const data = await res.json();
        console.log('📥 Cavab məlumatları:', data);
        
        // ✅ DÜZƏLDİLMİŞ HİSSƏ - success dəyərini birbaşa yoxla
        if (data.success === true) {
          setStatus('success');
          setMessage(data.message || 'Email uğurla dəyişdirildi!');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Token keçərsizdir və ya vaxtı keçib');
        }
      })
      .catch(err => {
        console.error('❌ Server xətası:', err);
        setStatus('error');
        setMessage('Serverə qoşulma xətası: ' + err.message);
      });
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '3px solid #f3f3f3', borderTop: '3px solid #d6800f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '20px', color: '#2c1810' }}>Email dəyişdirilir...</p>
        <p style={{ color: '#888', fontSize: '14px' }}>Zəhmət olmasa gözləyin</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '70px', height: '70px', background: '#27ae60', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '40px', color: 'white' }}>✓</span>
        </div>
        <h2 style={{ color: '#2c1810', marginBottom: '10px' }}>Email uğurla dəyişdirildi!</h2>
        <p style={{ color: '#5a4a42', marginBottom: '20px' }}>{message}</p>
        <p style={{ color: '#888', marginBottom: '30px' }}>3 saniyə sonra login səhifəsinə yönləndiriləcəksiniz...</p>
        <button 
          onClick={() => navigate('/login')} 
          style={{ background: '#d6800f', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          onMouseEnter={(e) => e.target.style.background = '#f4a742'}
          onMouseLeave={(e) => e.target.style.background = '#d6800f'}
        >
          İndi login ol
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '70px', height: '70px', background: '#e74c3c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px', color: 'white' }}>!</span>
      </div>
      <h2 style={{ color: '#2c1810', marginBottom: '10px' }}>Email dəyişdirilə bilmədi</h2>
      <p style={{ color: '#5a4a42', marginBottom: '30px' }}>{message}</p>
      <button 
        onClick={() => navigate('/')} 
        style={{ background: '#d6800f', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        onMouseEnter={(e) => e.target.style.background = '#f4a742'}
        onMouseLeave={(e) => e.target.style.background = '#d6800f'}
      >
        Ana səhifəyə qayıt
      </button>
    </div>
  );
};

export default VerifyEmailChange;