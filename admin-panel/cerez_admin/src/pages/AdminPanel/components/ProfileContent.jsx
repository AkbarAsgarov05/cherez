// src/components/AdminPanel/components/ProfileContent.jsx
import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiMapPin, FiCalendar, FiGlobe, FiBriefcase } from 'react-icons/fi';
import './ProfileContent.css';

const ProfileContent = () => {
  const [profileData, setProfileData] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '+994 50 123 45 67',
    bio: 'Super Admin və sistem inkişaf etdiricisi. 5 ildir bu platformada çalışır.',
    location: 'Bakı, Azərbaycan',
    website: 'www.asgarov.com',
    birthDate: '1990-01-15',
    department: 'İT Departamenti',
    position: 'Super Admin'
  });

  const [originalData, setOriginalData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formErrors, setFormErrors] = useState({});

  // İnitials üçün funksiya
  const getInitials = () => {
    const first = profileData.firstName?.charAt(0) || '';
    const last = profileData.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('profileData');
      const savedImage = localStorage.getItem('profileImage');
      const savedTimestamp = localStorage.getItem('profileTimestamp');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setProfileData(parsedData);
        setOriginalData(parsedData);
      } else {
        setOriginalData(profileData);
        localStorage.setItem('profileData', JSON.stringify(profileData));
        localStorage.setItem('profileTimestamp', new Date().toISOString());
      }
      
      if (savedImage) {
        setImagePreview(savedImage);
        setProfileImage(savedImage);
      } else {
        setImagePreview(null);
      }
      
      console.log('Məlumatlar yükləndi:', savedTimestamp);
    } catch (error) {
      console.error('LocalStorage oxuma xətası:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Şəkil ölçüsü maksimum 2MB ola bilər!');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!profileData.firstName.trim()) {
      errors.firstName = 'Ad tələb olunur';
    }
    
    if (!profileData.lastName.trim()) {
      errors.lastName = 'Soyad tələb olunur';
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'E-poçt tələb olunur';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Düzgün e-poçt daxil edin';
    }
    
    if (profileData.phone && !/^[\+\d\s-]+$/.test(profileData.phone)) {
      errors.phone = 'Düzgün telefon nömrəsi daxil edin';
    }
    
    if (profileData.website && !/^[a-zA-Z0-9][a-zA-Z0-9\.-]+\.[a-zA-Z]{2,}$/.test(profileData.website.replace('www.', ''))) {
      errors.website = 'Düzgün veb sayt daxil edin (məsələn: example.com)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('profileData', JSON.stringify(profileData));
      
      if (profileImage) {
        localStorage.setItem('profileImage', profileImage);
      } else {
        localStorage.removeItem('profileImage');
      }
      
      localStorage.setItem('profileTimestamp', new Date().toISOString());
      
      localStorage.setItem('profileBackup', JSON.stringify({
        data: profileData,
        image: profileImage,
        timestamp: new Date().toISOString()
      }));
      
      return true;
    } catch (error) {
      console.error('LocalStorage yazma xətası:', error);
      
      if (error.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem('profileBackup');
          localStorage.setItem('profileData', JSON.stringify(profileData));
          if (profileImage) {
            localStorage.setItem('profileImage', profileImage);
          }
          localStorage.setItem('profileTimestamp', new Date().toISOString());
          return true;
        } catch (retryError) {
          console.error('Təkrar cəhd də uğursuz:', retryError);
          return false;
        }
      }
      return false;
    }
  };

  const handleSave = () => {
    if (!validateForm()) {
      const firstError = Object.keys(formErrors)[0];
      if (firstError) {
        document.getElementsByName(firstError)[0]?.focus();
      }
      return;
    }
    
    setIsSaving(true);
    
    setTimeout(() => {
      const saved = saveToLocalStorage();
      
      if (saved) {
        setOriginalData(profileData);
        setSaveSuccess(true);
        setIsEditing(false);
        
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        alert('Məlumatlar yadda saxlanılarkən xəta baş verdi!');
      }
      
      setIsSaving(false);
    }, 1000);
  };

  const handleCancel = () => {
    if (originalData) {
      setProfileData(originalData);
    }
    
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setImagePreview(savedImage);
      setProfileImage(savedImage);
    } else {
      setImagePreview(null);
      setProfileImage(null);
    }
    
    setIsEditing(false);
    setFormErrors({});
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bütün məlumatları sıfırlamaq istədiyinizə əminsiniz?')) {
      const defaultData = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phone: '+994 50 123 45 67',
        bio: 'Super Admin və sistem inkişaf etdiricisi. 5 ildir bu platformada çalışır.',
        location: 'Bakı, Azərbaycan',
        website: 'www.asgarov.com',
        birthDate: '1990-01-15',
        department: 'İT Departamenti',
        position: 'Super Admin'
      };
      
      setProfileData(defaultData);
      setOriginalData(defaultData);
      setImagePreview(null);
      setProfileImage(null);
      
      localStorage.setItem('profileData', JSON.stringify(defaultData));
      localStorage.removeItem('profileImage');
      localStorage.setItem('profileTimestamp', new Date().toISOString());
      
      setIsEditing(false);
    }
  };

  return (
    <div className="profile-content-wrapper">
      <div className="profile-header-section">
        <h1 className="profile-page-title">Profilim</h1>
        <p className="profile-page-subtitle">Şəxsi məlumatlarınızı idarə edin</p>
      </div>

      {saveSuccess && (
        <div className="profile-success-message">
          <FiSave /> Profil məlumatları uğurla yadda saxlanıldı!
        </div>
      )}

      <div className="profile-main-card">
        <div className="profile-image-section">
          <div className="profile-image-container">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Profile" 
                className="profile-image"
              />
            ) : (
              <div className="profile-image-placeholder">
                <span className="profile-initials">{getInitials()}</span>
              </div>
            )}
            {isEditing && (
              <label htmlFor="profile-image-upload" className="profile-image-upload">
                <FiCamera />
                <input
                  type="file"
                  id="profile-image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          
          <div className="profile-name-title">
            <h2>{profileData.firstName} {profileData.lastName}</h2>
            <p>{profileData.position}</p>
          </div>

          {!isEditing && (
            <button className="profile-edit-button" onClick={handleEdit}>
              Profili Redaktə Et
            </button>
          )}
        </div>

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Şəxsi Məlumatlar
          </button>
          <button 
            className={`profile-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            Əlaqə Məlumatları
          </button>
          <button 
            className={`profile-tab ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            İş Məlumatları
          </button>
        </div>

        <div className="profile-tab-content">
          {activeTab === 'personal' && (
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiUser className="profile-form-icon" />
                  Ad
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleInputChange}
                      className={`profile-form-input ${formErrors.firstName ? 'error' : ''}`}
                      placeholder="Adınızı daxil edin"
                    />
                    {formErrors.firstName && (
                      <span className="profile-form-error">{formErrors.firstName}</span>
                    )}
                  </>
                ) : (
                  <p className="profile-form-text">{profileData.firstName}</p>
                )}
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiUser className="profile-form-icon" />
                  Soyad
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleInputChange}
                      className={`profile-form-input ${formErrors.lastName ? 'error' : ''}`}
                      placeholder="Soyadınızı daxil edin"
                    />
                    {formErrors.lastName && (
                      <span className="profile-form-error">{formErrors.lastName}</span>
                    )}
                  </>
                ) : (
                  <p className="profile-form-text">{profileData.lastName}</p>
                )}
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiCalendar className="profile-form-icon" />
                  Doğum Tarixi
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={profileData.birthDate}
                    onChange={handleInputChange}
                    className="profile-form-input"
                  />
                ) : (
                  <p className="profile-form-text">
                    {new Date(profileData.birthDate).toLocaleDateString('az-AZ')}
                  </p>
                )}
              </div>

              <div className="profile-form-group full-width">
                <label className="profile-form-label">Bioqrafiya</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="profile-form-textarea"
                    rows="4"
                    placeholder="Özünüz haqqında qısa məlumat"
                  />
                ) : (
                  <p className="profile-form-text bio-text">{profileData.bio}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiMail className="profile-form-icon" />
                  E-poçt
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className={`profile-form-input ${formErrors.email ? 'error' : ''}`}
                      placeholder="E-poçt ünvanınız"
                    />
                    {formErrors.email && (
                      <span className="profile-form-error">{formErrors.email}</span>
                    )}
                  </>
                ) : (
                  <p className="profile-form-text">{profileData.email}</p>
                )}
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiPhone className="profile-form-icon" />
                  Telefon
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className={`profile-form-input ${formErrors.phone ? 'error' : ''}`}
                      placeholder="+994 50 123 45 67"
                    />
                    {formErrors.phone && (
                      <span className="profile-form-error">{formErrors.phone}</span>
                    )}
                  </>
                ) : (
                  <p className="profile-form-text">{profileData.phone}</p>
                )}
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiMapPin className="profile-form-icon" />
                  Ünvan
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleInputChange}
                    className="profile-form-input"
                    placeholder="Şəhər, Ölkə"
                  />
                ) : (
                  <p className="profile-form-text">{profileData.location}</p>
                )}
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiGlobe className="profile-form-icon" />
                  Veb Sayt
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="website"
                      value={profileData.website}
                      onChange={handleInputChange}
                      className={`profile-form-input ${formErrors.website ? 'error' : ''}`}
                      placeholder="www.example.com"
                    />
                    {formErrors.website && (
                      <span className="profile-form-error">{formErrors.website}</span>
                    )}
                  </>
                ) : (
                  <p className="profile-form-text">{profileData.website}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiBriefcase className="profile-form-icon" />
                  Departament
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleInputChange}
                    className="profile-form-input"
                    placeholder="Departament"
                  />
                ) : (
                  <p className="profile-form-text">{profileData.department}</p>
                )}
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">
                  <FiUser className="profile-form-icon" />
                  Vəzifə
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="position"
                    value={profileData.position}
                    onChange={handleInputChange}
                    className="profile-form-input"
                    placeholder="Vəzifəniz"
                  />
                ) : (
                  <p className="profile-form-text">{profileData.position}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="profile-action-buttons">
            <button 
              className="profile-save-button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="profile-spinner"></span>
                  Yadda saxlanılır...
                </>
              ) : (
                <>
                  <FiSave /> Yadda Saxla
                </>
              )}
            </button>
            <button 
              className="profile-cancel-button"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Ləğv Et
            </button>
          </div>
        )}
      </div>
      
      {!isEditing && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleResetToDefault}
            style={{
              background: 'transparent',
              border: '1px solid #e2e8f0',
              color: '#718096',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f7fafc';
              e.target.style.color = '#f56565';
              e.target.style.borderColor = '#f56565';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#718096';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            Default Məlumatlara Sıfırla
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileContent;