import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiUser, FiX, FiMail, FiLock, FiPhone, FiUserCheck, FiCheckSquare, FiSquare } from "react-icons/fi";
import ForgotPassword from "./ForgotPassword";
import { authAPI } from "../services/api";
import "./LoginModal.css";

export default function LoginModal({ isOpen, onClose, onLoginSuccess, showNotification }) {
  const { t } = useTranslation();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isClosing, setIsClosing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Contact səhifəsindən gələn event-i dinlə
  useEffect(() => {
    const handleOpenLoginModal = () => {
      // Modal artıq açıqdırsa, yenidən açma
      if (!isOpen) {
        // Login modalını aç
        // Bu funksiya onClose və ya başqa bir şey vasitəsilə işləməlidir
        // Amma modal artıq isOpen=false olduğu üçün onu açmaq lazımdır
        // Burada bir həll yolu olaraq, əgər modal qapalıdırsa, onu açmaq üçün 
        // parent komponentdəki state-i dəyişmək lazımdır.
        // Bunun üçün bir callback istifadə edə bilərik.
        if (typeof onOpen === 'function') {
          onOpen();
        }
      }
    };
    
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => window.removeEventListener('openLoginModal', handleOpenLoginModal);
  }, [isOpen]);

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
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
      });
      setTermsAccepted(false);
      // ✅ Login modal bağlandıqda event göndər
      window.dispatchEvent(new CustomEvent('loginModalClosed'));
    }, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
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
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setIsForgotPasswordOpen(true);
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = t("login.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("login.errors.emailInvalid");
    }
    if (!formData.password) {
      newErrors.password = t("login.errors.passwordRequired");
    }
    return newErrors;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = t("login.errors.firstNameRequired");
    if (!formData.lastName) newErrors.lastName = t("login.errors.lastNameRequired");
    if (!formData.phone) {
      newErrors.phone = t("login.errors.phoneRequired");
    } else {
      const phoneNumbersOnly = formData.phone.replace(/\s/g, '');
      if (phoneNumbersOnly.length < 9 || phoneNumbersOnly.length > 10) {
        newErrors.phone = t("login.errors.phoneInvalid");
      } else if (!/^[0-9]+$/.test(phoneNumbersOnly)) {
        newErrors.phone = t("login.errors.phoneDigits");
      }
    }
    if (!formData.email) {
      newErrors.email = t("login.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("login.errors.emailInvalid");
    }
    if (!formData.password) {
      newErrors.password = t("login.errors.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("login.errors.passwordMin");
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("login.errors.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("login.errors.confirmPasswordMatch");
    }
    
    if (!termsAccepted) {
      newErrors.terms = t("login.errors.termsRequired");
    }
    
    return newErrors;
  };

  const isRegisterFormValid = () => {
    if (isLogin) return true;
    
    const isFirstNameFilled = formData.firstName.trim() !== "";
    const isLastNameFilled = formData.lastName.trim() !== "";
    const isPhoneFilled = formData.phone.trim() !== "";
    const isEmailFilled = formData.email.trim() !== "";
    const isPasswordFilled = formData.password.trim() !== "";
    const isConfirmPasswordFilled = formData.confirmPassword.trim() !== "";
    const isTermsAccepted = termsAccepted === true;
    
    const allFieldsFilled = isFirstNameFilled && isLastNameFilled && isPhoneFilled && 
                            isEmailFilled && isPasswordFilled && isConfirmPasswordFilled;
    
    return allFieldsFilled && isTermsAccepted;
  };

  const handleLogin = async () => {
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      
      const response = await authAPI.login(cleanEmail, formData.password);
      
      if (response && response.success) {
        const fullName = response.user.name || "";
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(' ') || "";
        
        const userDataToStore = {
          id: response.user.id,
          name: response.user.name,
          firstName: firstName,
          lastName: lastName,
          email: response.user.email,
          phone: response.user.phone || "",
          address: response.user.address || "",
          paymentMethod: response.user.paymentMethod || "cash",
          loginTime: new Date().toISOString(),
          forcePasswordChange: response.user.forcePasswordChange || false
        };
        
        localStorage.setItem("userData", JSON.stringify(userDataToStore));
        localStorage.setItem("accessToken", response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        
        if (typeof showNotification === 'function') {
          showNotification(t("login.notifications.loginSuccess"), "success");
        }
        
        const userData = {
          id: response.user.id,
          firstName: firstName,
          lastName: lastName,
          email: response.user.email,
          phone: response.user.phone || "",
          address: response.user.address || "",
          paymentMethod: response.user.paymentMethod || "cash",
          loginTime: new Date().toISOString(),
          forcePasswordChange: response.user.forcePasswordChange || false
        };
        
        // ✅ Login uğurlu oldu - event göndər
        window.dispatchEvent(new CustomEvent('loginSuccess', { detail: userData }));
        
        if (userData.forcePasswordChange) {
          if (typeof showNotification === 'function') {
            showNotification(t("account.passwordChangeRequired", "Təhlükəsizlik səbəbindən şifrənizi yeniləməlisiniz!"), "warning");
          }
          window.dispatchEvent(new CustomEvent('openAccountSettings'));
        }
        
        onLoginSuccess(userData);
        handleClose();
      } else {
        throw new Error("Login uğursuz oldu");
      }
    } catch (error) {
      console.error("Login xətası:", error);
      
      let errorMessage = t("login.errors.wrongCredentials");
      
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        if (backendMessage && 
            !backendMessage.includes("Request failed") && 
            !backendMessage.includes("401") &&
            !backendMessage.includes("500")) {
          errorMessage = backendMessage;
        }
      } else if (error.message && 
                 !error.message.includes("Request failed") && 
                 !error.message.includes("401")) {
        errorMessage = error.message;
      }
      
      setErrors({ 
        email: errorMessage, 
        password: errorMessage 
      });
      
      if (typeof showNotification === 'function') {
        showNotification(errorMessage, "error");
      }
    }
  };

  const handleRegister = async () => {
    try {
      const cleanPhone = getCleanPhoneNumber(formData.phone);
      
      const response = await authAPI.register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        password: formData.password
      });
      
      if (response && response.success) {
        if (typeof showNotification === 'function') {
          showNotification(t("login.notifications.registerSuccess"), "success");
        }
        
        const loginResponse = await authAPI.login(formData.email.trim().toLowerCase(), formData.password);
        
        if (loginResponse && loginResponse.success) {
          const firstName = formData.firstName;
          const lastName = formData.lastName;
          
          const userDataToStore = {
            id: loginResponse.user.id,
            name: loginResponse.user.name,
            firstName: firstName,
            lastName: lastName,
            email: formData.email,
            phone: cleanPhone,
            address: "",
            paymentMethod: "cash",
            loginTime: new Date().toISOString(),
            forcePasswordChange: loginResponse.user.forcePasswordChange || false
          };
          
          localStorage.setItem("userData", JSON.stringify(userDataToStore));
          localStorage.setItem("accessToken", loginResponse.accessToken);
          if (loginResponse.refreshToken) {
            localStorage.setItem("refreshToken", loginResponse.refreshToken);
          }
          
          const userData = {
            id: loginResponse.user.id,
            firstName: firstName,
            lastName: lastName,
            email: formData.email,
            phone: cleanPhone,
            address: "",
            paymentMethod: "cash",
            loginTime: new Date().toISOString(),
            forcePasswordChange: loginResponse.user.forcePasswordChange || false
          };
          
          // ✅ Register uğurlu oldu - event göndər
          window.dispatchEvent(new CustomEvent('loginSuccess', { detail: userData }));
          
          onLoginSuccess(userData);
          handleClose();
        }
      }
    } catch (error) {
      console.error("Register xətası:", error);
      
      let errorMessage = error.message || t("login.errors.registerError");
      
      const lowerMessage = errorMessage.toLowerCase();
      
      if (lowerMessage.includes("email")) {
        setErrors({ email: errorMessage });
      } else if (lowerMessage.includes("phone") || lowerMessage.includes("telefon")) {
        setErrors({ phone: errorMessage });
      } else {
        setErrors({ email: errorMessage });
      }
      
      if (typeof showNotification === 'function') {
        showNotification(errorMessage, "error");
      }
    }
  };

  const handleButtonClick = async () => {
    const validationErrors = isLogin ? validateLogin() : validateRegister();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      if (firstError && typeof showNotification === 'function') {
        showNotification(firstError, "error");
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      console.error("Auth xətası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSwitching(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setErrors({});
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
      });
      setTermsAccepted(false);
      setIsSwitching(false);
    }, 200);
  };

  const toggleTermsAccepted = () => {
    setTermsAccepted(!termsAccepted);
    if (errors.terms) {
      setErrors(prev => ({ ...prev, terms: "" }));
    }
  };

  const isButtonDisabled = isLogin ? false : (!isRegisterFormValid() || isLoading);

  return (
    <>
      <div className={`cerez-login-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
        <div className={`cerez-login-modal ${isClosing ? 'closing' : ''} ${isSwitching ? 'switching' : ''}`} onClick={(e) => e.stopPropagation()}>
          <button className="cerez-login-modal-close" onClick={handleClose}>
            <FiX />
          </button>

          <div className={`cerez-login-modal-content ${isSwitching ? 'fade-out' : 'fade-in'}`}>
            <div className="cerez-login-modal-header">
              <div className="cerez-login-modal-icon">
                <FiUser />
              </div>
              <h2 className="cerez-login-modal-title">
                {isLogin ? t("login.welcome") : t("login.createAccount")}
              </h2>
              <p className="cerez-login-modal-subtitle">
                {isLogin ? t("login.loginToAccount") : t("login.createNewAccount")}
              </p>
            </div>

            <div className="cerez-login-form">
              {!isLogin && (
                <>
                  <div className="cerez-login-form-row">
                    <div className="cerez-login-form-group half">
                      <label>{t("login.firstName")}</label>
                      <div className="cerez-login-input-wrapper">
                        <FiUserCheck className="cerez-login-input-icon" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder={t("login.firstNamePlaceholder")}
                          className={errors.firstName ? "error" : ""}
                          autoComplete="off"
                        />
                      </div>
                      {errors.firstName && <span className="cerez-login-error-message">{errors.firstName}</span>}
                    </div>

                    <div className="cerez-login-form-group half">
                      <label>{t("login.lastName")}</label>
                      <div className="cerez-login-input-wrapper">
                        <FiUser className="cerez-login-input-icon" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder={t("login.lastNamePlaceholder")}
                          className={errors.lastName ? "error" : ""}
                          autoComplete="off"
                        />
                      </div>
                      {errors.lastName && <span className="cerez-login-error-message">{errors.lastName}</span>}
                    </div>
                  </div>

                  <div className="cerez-login-form-group">
                    <label>{t("login.phone")}</label>
                    <div className="cerez-login-input-wrapper">
                      <FiPhone className="cerez-login-input-icon" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t("login.phonePlaceholder")}
                        className={errors.phone ? "error" : ""}
                        autoComplete="off"
                      />
                    </div>
                    {errors.phone && <span className="cerez-login-error-message">{errors.phone}</span>}
                  </div>
                </>
              )}

              <div className="cerez-login-form-group">
                <label>{t("login.email")}</label>
                <div className="cerez-login-input-wrapper">
                  <FiMail className="cerez-login-input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t("login.emailPlaceholder")}
                    className={errors.email ? "error" : ""}
                    autoComplete="off"
                  />
                </div>
                {errors.email && <span className="cerez-login-error-message">{errors.email}</span>}
              </div>

              <div className="cerez-login-form-group">
                <label>{t("login.password")}</label>
                <div className="cerez-login-input-wrapper">
                  <FiLock className="cerez-login-input-icon" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("login.passwordPlaceholder")}
                    className={errors.password ? "error" : ""}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                </div>
                {errors.password && <span className="cerez-login-error-message">{errors.password}</span>}
              </div>

              {!isLogin && (
                <>
                  <div className="cerez-login-form-group">
                    <label>{t("login.confirmPassword")}</label>
                    <div className="cerez-login-input-wrapper">
                      <FiLock className="cerez-login-input-icon" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder={t("login.confirmPasswordPlaceholder")}
                        className={errors.confirmPassword ? "error" : ""}
                        autoComplete="off"
                      />
                    </div>
                    {errors.confirmPassword && <span className="cerez-login-error-message">{errors.confirmPassword}</span>}
                  </div>

                  <div className="cerez-login-form-group cerez-login-terms-group">
                    <div 
                      className={`cerez-login-terms-checkbox-wrapper ${errors.terms ? 'error' : ''}`}
                      onClick={toggleTermsAccepted}
                    >
                      <div className="cerez-login-terms-checkbox">
                        {termsAccepted ? (
                          <FiCheckSquare className="cerez-login-checkbox-icon checked" />
                        ) : (
                          <FiSquare className="cerez-login-checkbox-icon unchecked" />
                        )}
                      </div>
                      <span className="cerez-login-terms-text">
                        {t("login.terms.agree", "Mən")}{" "}
                        <a 
                          href="/terms-of-service" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="cerez-login-terms-link"
                        >
                          {t("login.terms.link", "İstifadəçi Şərtləri")}
                        </a>
                        {" "}{t("login.terms.and", "və")}{" "}
                        <a 
                          href="/privacy-policy" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="cerez-login-terms-link"
                        >
                          {t("login.terms.privacy", "Məxfilik Siyasəti")}
                        </a>
                        {" "}{t("login.terms.accept", "ilə razıyam")}
                      </span>
                    </div>
                    {errors.terms && <span className="cerez-login-error-message">{errors.terms}</span>}
                  </div>
                </>
              )}

              {isLogin && (
                <div className="cerez-login-forgot-password">
                  <a href="#" onClick={handleForgotPassword}>{t("login.forgotPassword")}</a>
                </div>
              )}

              <button 
                type="button"
                className={`cerez-login-submit-button ${isButtonDisabled ? 'disabled' : ''}`}
                disabled={isButtonDisabled}
                onClick={handleButtonClick}
              >
                {isLoading 
                  ? (isLogin ? t("login.loggingIn") : t("login.registering")) 
                  : (isLogin ? t("login.loginButton") : t("login.registerButton"))}
              </button>
            </div>

            <div className="cerez-login-modal-footer">
              <p>
                {isLogin ? t("login.noAccount") : t("login.haveAccount")}
                <button className="cerez-login-switch-mode" onClick={switchMode}>
                  {isLogin ? t("login.register") : t("login.login")}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ForgotPassword
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        showNotification={showNotification}
      />
    </>
  );
}