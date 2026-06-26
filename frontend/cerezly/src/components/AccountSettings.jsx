import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiUser, FiMail, FiPhone, FiLock, FiX, FiSave, FiUserCheck, FiMapPin, FiCreditCard } from "react-icons/fi";
import api from "../services/api";
import "./AccountSettings.css";

export default function AccountSettings({ isOpen, onClose, userData, onUpdateSuccess, showNotification }) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cash",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paymentDropdownRef = useRef(null);

  // forcePasswordChange üçün event dinləyici
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsEditing(true);
    };
    
    window.addEventListener('openAccountSettings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('openAccountSettings', handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target)) {
        setIsPaymentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // userData gələndə formanı doldur
  useEffect(() => {
    if (userData) {
      const formattedPhone = formatPhoneForDisplay(userData.phone || "");
      
      let addressValue = '';
      if (userData.address) {
        if (typeof userData.address === 'object') {
          addressValue = userData.address.street || '';
        } else {
          addressValue = userData.address;
        }
      }
      
      const userInfo = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: formattedPhone,
        address: addressValue,
        paymentMethod: userData.paymentMethod || "cash"
      };
      setFormData(prev => ({
        ...prev,
        ...userInfo
      }));
      setOriginalData(userInfo);
    }
  }, [userData]);

  const formatPhoneForDisplay = (phone) => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (cleanPhone.length === 10) {
      return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 8)} ${cleanPhone.slice(8)}`;
    } else if (cleanPhone.length === 9) {
      return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5, 7)} ${cleanPhone.slice(7)}`;
    }
    return phone;
  };

  const getCleanPhoneNumber = (phone) => {
    return phone.replace(/\s/g, '');
  };

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      setErrors({});
      setIsEditing(false);
      setIsPaymentDropdownOpen(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      }));
    }, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      showNotification(
        t('account.emailChangeNotAllowed', 'Email ünvanını dəyişmək mümkün deyil!'),
        'warning'
      );
      return;
    }
    
    if (name === 'phone') {
      const numbersOnly = value.replace(/[^\d]/g, '');
      
      let formattedValue = '';
      if (numbersOnly.length <= 3) {
        formattedValue = numbersOnly;
      } else if (numbersOnly.length <= 6) {
        formattedValue = `${numbersOnly.slice(0, 3)} ${numbersOnly.slice(3)}`;
      } else if (numbersOnly.length <= 8) {
        formattedValue = `${numbersOnly.slice(0, 3)} ${numbersOnly.slice(3, 6)} ${numbersOnly.slice(6)}`;
      } else {
        formattedValue = `${numbersOnly.slice(0, 3)} ${numbersOnly.slice(3, 6)} ${numbersOnly.slice(6, 8)} ${numbersOnly.slice(8, 10)}`;
      }
      
      if (formattedValue.length > 13) {
        formattedValue = formattedValue.slice(0, 13);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handlePaymentMethodChange = (value) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: value
    }));
    setIsPaymentDropdownOpen(false);
    if (errors.paymentMethod) {
      setErrors(prev => ({
        ...prev,
        paymentMethod: ""
      }));
    }
  };

  const getPaymentMethodLabel = () => {
    switch(formData.paymentMethod) {
      case 'cash': return t('account.cash');
      case 'card': return t('account.card');
      case 'online': return t('account.online');
      default: return t('account.cash');
    }
  };

  const hasProfileChanges = () => {
    return (
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.phone !== originalData.phone ||
      formData.address !== originalData.address ||
      formData.paymentMethod !== originalData.paymentMethod
    );
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.firstName) {
      newErrors.firstName = t('login.errors.firstNameRequired');
    }
    if (!formData.lastName) {
      newErrors.lastName = t('login.errors.lastNameRequired');
    }
    if (!formData.phone) {
      newErrors.phone = t('login.errors.phoneRequired');
    } else {
      const phoneNumbersOnly = formData.phone.replace(/\s/g, '');
      if (phoneNumbersOnly.length < 9 || phoneNumbersOnly.length > 10) {
        newErrors.phone = t('login.errors.phoneInvalid');
      } else if (!/^[0-9]+$/.test(phoneNumbersOnly)) {
        newErrors.phone = t('login.errors.phoneDigits');
      }
    }
    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = t('account.currentPasswordRequired');
    }
    if (!formData.newPassword) {
      newErrors.newPassword = t('account.newPasswordRequired');
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = t('login.errors.passwordMin');
    }
    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = t('account.confirmPasswordRequired');
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = t('login.errors.confirmPasswordMatch');
    }
    return newErrors;
  };

  const handleUpdateProfile = async () => {
    if (!hasProfileChanges()) {
      showNotification(t('account.noChanges'), "info");
      return;
    }

    const validationErrors = validateProfile();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanPhone = getCleanPhoneNumber(formData.phone);
      const name = `${formData.firstName} ${formData.lastName}`;
      
      const response = await api.put("/users/profile", {
        name: name,
        phone: cleanPhone,
        address: formData.address
      });
      
      if (response.data.success) {
        showNotification(t('account.profileUpdated'), "success");
        
        const backendUser = response.data.user;
        
        let savedAddress = formData.address;
        if (backendUser.address) {
          if (typeof backendUser.address === 'object') {
            savedAddress = backendUser.address.street || formData.address;
          } else {
            savedAddress = backendUser.address;
          }
        }
        
        const updatedUser = {
          id: backendUser.id || userData.id,
          firstName: backendUser.firstName || formData.firstName,
          lastName: backendUser.lastName || formData.lastName,
          name: backendUser.name || name,
          email: backendUser.email || userData.email,
          phone: backendUser.phone || cleanPhone,
          address: savedAddress,
          paymentMethod: backendUser.paymentMethod || formData.paymentMethod,
          loginTime: new Date().toISOString(),
          forcePasswordChange: backendUser.forcePasswordChange || false
        };
        
        console.log('💾 Yenilənmiş user məlumatları:', updatedUser);
        localStorage.setItem("userData", JSON.stringify(updatedUser));
        
        onUpdateSuccess(updatedUser);
        setOriginalData({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: originalData.email,
          phone: formData.phone,
          address: savedAddress,
          paymentMethod: formData.paymentMethod
        });
        
        handleClose();
      }
    } catch (error) {
      console.error("Profil yeniləmə xətası:", error);
      const errorMessage = error.response?.data?.message || t('account.updateError');
      showNotification(errorMessage, "error");
      
      if (error.response?.data?.message?.includes("email")) {
        setErrors({ email: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ DÜZƏLDİLMİŞ ŞİFRƏ YENİLƏ FUNKSİYASI
  const handleUpdatePassword = async () => {
    const validationErrors = validatePassword();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      showNotification(t('account.passwordSameError'), "warning");
      setErrors({ newPassword: t('account.passwordSameError') });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.put("/users/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      if (response.data.success) {
        showNotification(t('account.passwordUpdated'), "success");
        
        // ✅ TOKENLƏRİ TƏMİZLƏ
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: ""
        }));
        setErrors({});
        
        // ✅ MODALI BAĞLA
        handleClose();
        
        // ✅ BİLDİRİŞ GÖSTƏR
        showNotification(t('account.passwordChangedRelogin'), "info");
        
        // ✅ 1.5 SANİYƏ SONRA SƏHİFƏNİ YENİLƏ
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Şifrə yeniləmə xətası:", error);
      const errorMessage = error.response?.data?.message || t('account.passwordUpdateError');
      showNotification(errorMessage, "error");
      
      if (error.response?.data?.message?.includes("cari")) {
        setErrors({ currentPassword: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tab) => {
    setIsSwitching(true);
    setTimeout(() => {
      setIsEditing(tab);
      setIsSwitching(false);
    }, 200);
  };

  return (
    <div className={`account-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`account-modal ${isClosing ? 'closing' : ''} ${isSwitching ? 'switching' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="account-modal-close" onClick={handleClose}>
          <FiX />
        </button>

        <div className={`account-modal-content ${isSwitching ? 'fade-out' : 'fade-in'}`}>
          <div className="account-modal-header">
            <div className="account-modal-icon">
              <FiUserCheck />
            </div>
            <h2 className="account-modal-title">{t('account.accountSettings')}</h2>
            <p className="account-modal-subtitle">{t('account.manageAccount')}</p>
          </div>

          <div className="account-tabs">
            <button 
              className={`account-tab ${!isEditing ? 'active' : ''}`}
              onClick={() => switchTab(false)}
            >
              {t('account.profileInfo')}
            </button>
            <button 
              className={`account-tab ${isEditing ? 'active' : ''}`}
              onClick={() => switchTab(true)}
            >
              {t('account.changePassword')}
            </button>
          </div>

          {!isEditing ? (
            <div className="account-form">
              <div className="account-form-row">
                <div className="account-form-group half">
                  <label>{t('login.firstName')}</label>
                  <div className="account-input-wrapper">
                    <FiUser className="account-input-icon" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder={t('login.firstNamePlaceholder')}
                      className={errors.firstName ? "error" : ""}
                    />
                  </div>
                  {errors.firstName && <span className="account-error-message">{errors.firstName}</span>}
                </div>

                <div className="account-form-group half">
                  <label>{t('login.lastName')}</label>
                  <div className="account-input-wrapper">
                    <FiUserCheck className="account-input-icon" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder={t('login.lastNamePlaceholder')}
                      className={errors.lastName ? "error" : ""}
                    />
                  </div>
                  {errors.lastName && <span className="account-error-message">{errors.lastName}</span>}
                </div>
              </div>

              <div className="account-form-group">
                <label>{t('login.email')}</label>
                <div className="account-input-wrapper">
                  <FiMail className="account-input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('login.emailPlaceholder')}
                    className={errors.email ? "error" : ""}
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </div>
                {errors.email && <span className="account-error-message">{errors.email}</span>}
                <small className="account-email-hint" style={{ color: '#d6800f', fontSize: '11px', marginTop: '5px', display: 'block' }}>
                  ⚠️ {t('account.emailCannotChange', 'Email ünvanını dəyişmək mümkün deyil. ')}
                </small>
              </div>

              <div className="account-form-group">
                <label>{t('login.phone')}</label>
                <div className="account-input-wrapper">
                  <FiPhone className="account-input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('login.phonePlaceholder')}
                    className={errors.phone ? "error" : ""}
                  />
                </div>
                {errors.phone && <span className="account-error-message">{errors.phone}</span>}
              </div>

              <div className="account-form-group">
                <label>{t('account.address')}</label>
                <div className="account-input-wrapper">
                  <FiMapPin className="account-input-icon" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t('account.addressPlaceholder')}
                    className={errors.address ? "error" : ""}
                  />
                </div>
                {errors.address && <span className="account-error-message">{errors.address}</span>}
              </div>

              <div className="account-form-group">
                <label>{t('account.paymentMethod')}</label>
                <div className="account-custom-select" ref={paymentDropdownRef}>
                  <div 
                    className="account-custom-select-trigger"
                    onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                  >
                    <FiCreditCard className="account-input-icon" />
                    <span className="trigger-text">{getPaymentMethodLabel()}</span>
                    <svg className={`custom-select-arrow ${isPaymentDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="18" height="18">
                      <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  
                  {isPaymentDropdownOpen && (
                    <div className="account-custom-select-dropdown">
                      <div 
                        className={`custom-select-option ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}
                        onClick={() => handlePaymentMethodChange('cash')}
                      >
                        <span>{t('account.cash')}</span>
                        {formData.paymentMethod === 'cash' && <span className="check-icon">✓</span>}
                      </div>
                      <div 
                        className={`custom-select-option ${formData.paymentMethod === 'card' ? 'selected' : ''}`}
                        onClick={() => handlePaymentMethodChange('card')}
                      >
                        <span>{t('account.card')}</span>
                        {formData.paymentMethod === 'card' && <span className="check-icon">✓</span>}
                      </div>
                      <div 
                        className={`custom-select-option ${formData.paymentMethod === 'online' ? 'selected' : ''}`}
                        onClick={() => handlePaymentMethodChange('online')}
                      >
                        <span>{t('account.online')}</span>
                        {formData.paymentMethod === 'online' && <span className="check-icon">✓</span>}
                      </div>
                    </div>
                  )}
                </div>
                {errors.paymentMethod && <span className="account-error-message">{errors.paymentMethod}</span>}
              </div>

              {/* PROFİL YENİLƏMƏ DÜYMƏSİ - DÜZƏLDİLDİ */}
              <button className="account-save-button" onClick={handleUpdateProfile} disabled={isLoading}>
                <FiSave className="account-save-icon" />
                {isLoading ? t('account.savingProfile') : t('account.saveChanges')}
              </button>
            </div>
          ) : (
            <div className="account-form">
              <div className="account-form-group">
                <label>{t('account.currentPassword')}</label>
                <div className="account-input-wrapper">
                  <FiLock className="account-input-icon" />
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder={t('account.currentPasswordPlaceholder')}
                    className={errors.currentPassword ? "error" : ""}
                  />
                </div>
                {errors.currentPassword && <span className="account-error-message">{errors.currentPassword}</span>}
              </div>

              <div className="account-form-group">
                <label>{t('account.newPassword')}</label>
                <div className="account-input-wrapper">
                  <FiLock className="account-input-icon" />
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder={t('account.newPasswordPlaceholder')}
                    className={errors.newPassword ? "error" : ""}
                  />
                </div>
                {errors.newPassword && <span className="account-error-message">{errors.newPassword}</span>}
              </div>

              <div className="account-form-group">
                <label>{t('account.confirmNewPassword')}</label>
                <div className="account-input-wrapper">
                  <FiLock className="account-input-icon" />
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleInputChange}
                    placeholder={t('account.confirmNewPasswordPlaceholder')}
                    className={errors.confirmNewPassword ? "error" : ""}
                  />
                </div>
                {errors.confirmNewPassword && <span className="account-error-message">{errors.confirmNewPassword}</span>}
              </div>

              {/* ŞİFRƏ YENİLƏMƏ DÜYMƏSİ - DÜZƏLDİLDİ */}
              <button className="account-save-button" onClick={handleUpdatePassword} disabled={isLoading}>
                <FiSave className="account-save-icon" />
                {isLoading ? t('account.savingPassword') : t('account.changePasswordBtn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}