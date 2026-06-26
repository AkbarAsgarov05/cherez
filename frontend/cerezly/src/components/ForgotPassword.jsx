import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiX, FiMail, FiLock, FiCheckCircle, FiArrowLeft, FiSend } from "react-icons/fi";
import api from "../services/api";
import "./ForgotPassword.css";

export default function ForgotPassword({ isOpen, onClose, showNotification }) {
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setStep(1);
      setEmail("");
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setCountdown(0);
      setResetToken("");
      onClose();
    }, 300);
  };

  // ========== 1. TƏSDİQ KODU GÖNDƏR ==========
  const handleSendCode = async () => {
    if (!email) {
      setErrors({ email: t("forgotPassword.errors.emailRequired") });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: t("forgotPassword.errors.emailInvalid") });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post("/auth/forgot-password", { email });
      
      if (response.data.success) {
        setResetToken(response.data.resetToken);
        showNotification(t("forgotPassword.notifications.codeSent"), "info");
        setStep(2);
        setCountdown(60);
      }
    } catch (error) {
      console.error("Kod göndərmə xətası:", error);
      const errorMessage = error.response?.data?.message || t("forgotPassword.errors.userNotFound");
      setErrors({ email: errorMessage });
      showNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== 2. KODU TƏSDİQ ET ==========
  const handleVerifyCode = () => {
    const newErrors = {};
    
    if (!verificationCode) {
      newErrors.verificationCode = t("forgotPassword.errors.codeRequired");
    } else if (verificationCode.length !== 6) {
      newErrors.verificationCode = t("forgotPassword.errors.codeInvalid");
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setStep(3);
    setErrors({});
  };

  // ========== 3. KODU TƏKRAR GÖNDƏR ==========
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.post("/auth/forgot-password", { email });
      
      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setCountdown(60);
        showNotification(t("forgotPassword.notifications.codeResent"), "info");
      }
    } catch (error) {
      console.error("Kod təkrar göndərmə xətası:", error);
      showNotification(t("forgotPassword.errors.resendError"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== 4. ŞİFRƏ SIFIRLA ==========
  const handleResetPassword = async () => {
    const newErrors = {};
    
    if (!newPassword) {
      newErrors.newPassword = t("forgotPassword.errors.newPasswordRequired");
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t("forgotPassword.errors.newPasswordMin");
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = t("forgotPassword.errors.confirmPasswordRequired");
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t("forgotPassword.errors.confirmPasswordMatch");
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.post("/auth/reset-password", {
        email: email,
        code: verificationCode,
        newPassword: newPassword
      });
      
      if (response.data.success) {
        showNotification(t("forgotPassword.notifications.passwordUpdated"), "success");
        handleClose();
      }
    } catch (error) {
      console.error("Şifrə yeniləmə xətası:", error);
      const errorMessage = error.response?.data?.message || t("forgotPassword.errors.resetError");
      showNotification(errorMessage, "error");
      
      if (error.response?.data?.message?.includes("kod")) {
        setErrors({ verificationCode: errorMessage });
        setStep(2);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setVerificationCode("");
      setErrors({});
      setCountdown(0);
    } else if (step === 3) {
      setStep(2);
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }
  };

  return (
    <div className={`forgot-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`forgot-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="forgot-modal-close" onClick={handleClose}>
          <FiX />
        </button>

        <div className="forgot-modal-content">
          {/* Step 1: Email */}
          {step === 1 && (
            <div className="forgot-step">
              <div className="forgot-header">
                <div className="forgot-icon">
                  <FiMail />
                </div>
                <h2>{t("forgotPassword.title")}</h2>
                <p>{t("forgotPassword.subtitle")}</p>
              </div>

              <div className="forgot-form">
                <div className="forgot-form-group">
                  <label>{t("forgotPassword.emailLabel")}</label>
                  <div className="forgot-input-wrapper">
                    <FiMail className="forgot-input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({});
                      }}
                      placeholder=""
                      className={errors.email ? "error" : ""}
                      autoFocus
                    />
                  </div>
                  {errors.email && <span className="forgot-error-message">{errors.email}</span>}
                </div>

                <button 
                  className="forgot-submit-button" 
                  onClick={handleSendCode}
                  disabled={isLoading}
                >
                  {isLoading ? t("forgotPassword.sendingButton") : t("forgotPassword.sendButton")}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Verification Code */}
          {step === 2 && (
            <div className="forgot-step">
              <button className="forgot-back-button" onClick={handleBack}>
                <FiArrowLeft /> {t("forgotPassword.backButton")}
              </button>

              <div className="forgot-header">
                <div className="forgot-icon">
                  <FiSend />
                </div>
                <h2>{t("forgotPassword.verificationTitle")}</h2>
                <p>{t("forgotPassword.verificationSubtitle", { email })}</p>
              </div>

              <div className="forgot-form">
                <div className="forgot-form-group">
                  <label>{t("forgotPassword.codeLabel")}</label>
                  <div className="forgot-input-wrapper">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
                        setVerificationCode(onlyNumbers);
                        if (errors.verificationCode) setErrors({});
                      }}
                      placeholder=""
                      className={errors.verificationCode ? "error" : ""}
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  {errors.verificationCode && <span className="forgot-error-message">{errors.verificationCode}</span>}
                </div>

                <div className="forgot-resend">
                  <button 
                    onClick={handleResendCode} 
                    disabled={countdown > 0 || isLoading}
                    className={countdown > 0 ? "disabled" : ""}
                  >
                    {countdown > 0 
                      ? t("forgotPassword.resendDisabled", { countdown }) 
                      : t("forgotPassword.resendButton")}
                  </button>
                </div>

                <button className="forgot-submit-button" onClick={handleVerifyCode}>
                  {t("forgotPassword.verifyButton")}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <div className="forgot-step">
              <button className="forgot-back-button" onClick={handleBack}>
                <FiArrowLeft /> {t("forgotPassword.backButton")}
              </button>

              <div className="forgot-header">
                <div className="forgot-icon">
                  <FiLock />
                </div>
                <h2>{t("forgotPassword.newPasswordTitle")}</h2>
                <p>{t("forgotPassword.newPasswordSubtitle")}</p>
              </div>

              <div className="forgot-form">
                <div className="forgot-form-group">
                  <label>{t("forgotPassword.newPasswordLabel")}</label>
                  <div className="forgot-input-wrapper">
                    <FiLock className="forgot-input-icon" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) setErrors({});
                      }}
                      placeholder=""
                      className={errors.newPassword ? "error" : ""}
                    />
                  </div>
                  {errors.newPassword && <span className="forgot-error-message">{errors.newPassword}</span>}
                </div>

                <div className="forgot-form-group">
                  <label>{t("forgotPassword.confirmPasswordLabel")}</label>
                  <div className="forgot-input-wrapper">
                    <FiCheckCircle className="forgot-input-icon" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({});
                      }}
                      placeholder=""
                      className={errors.confirmPassword ? "error" : ""}
                    />
                  </div>
                  {errors.confirmPassword && <span className="forgot-error-message">{errors.confirmPassword}</span>}
                </div>

                <button 
                  className="forgot-submit-button" 
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? t("forgotPassword.updatingButton") : t("forgotPassword.updateButton")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}