import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Email transporter yarat
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Şifrə sıfırlama kodu göndər
export const sendResetPasswordCode = async (to, code, name) => {
  try {
    const info = await transporter.sendMail({
      from: `"Cerez Shop" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Şifrə Sıfırlama Kodu',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Şifrə Sıfırlama</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #d6800f, #f4a742); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .code-box { background: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; border: 1px solid #e0e0e0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d6800f; font-family: monospace; }
            .footer { background: #f8f8f8; padding: 15px; text-align: center; color: #888; font-size: 12px; }
            .warning { color: #e74c3c; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Şifrə Sıfırlama</h1>
            </div>
            <div class="content">
              <p>Salam, <strong>${name || 'İstifadəçi'}</strong>,</p>
              <p>Şifrənizi sıfırlamaq üçün aşağıdakı təsdiq kodunu istifadə edin:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>Bu kod <strong>10 dəqiqə</strong> ərzində keçərlidir.</p>
              <p>Əgər bu əməliyyatı siz tələb etməmisinizsə, bu emaili ignore edin. Hesabınız təhlükəsizdir.</p>
              <div class="warning">
                ⚠️ Heç vaxt bu kodu başqaları ilə paylaşmayın!
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Cerez Shop. Bütün hüquqlar qorunur.</p>
              <p>Bu email avtomatik göndərilib, cavab verməyin.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Şifrə sıfırlama emaili göndərildi: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Email göndərmə xətası:', error);
    return false;
  }
};

// ✅ YENİ - Email dəyişmə təsdiqi (yeni emailə)
export const sendEmailChangeVerification = async (to, name, verifyLink) => {
  try {
    await transporter.sendMail({
      from: `"Cerez Shop" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '📧 Email Ünvanınızın Dəyişdirilməsi Təsdiqi',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Dəyişdirmə Təsdiqi</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #27ae60, #2ecc71); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #d6800f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; margin: 20px 0; font-weight: bold; }
            .footer { background: #f8f8f8; padding: 15px; text-align: center; color: #888; font-size: 12px; }
            .warning { color: #e74c3c; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Email Dəyişdirmə Təsdiqi</h1>
            </div>
            <div class="content">
              <p>Salam, <strong>${name || 'İstifadəçi'}</strong>,</p>
              <p>Admin tərəfindən email ünvanınızın dəyişdirilməsi tələb olunub.</p>
              <p>Bu əməliyyatı təsdiqləmək üçün aşağıdakı düyməyə klikləyin:</p>
              <div style="text-align: center;">
                <a href="${verifyLink}" class="button">✅ Email Dəyişdir</a>
              </div>
              <p>Bu link <strong>1 saat</strong> ərzində keçərlidir.</p>
              <p>Əgər bu əməliyyatı siz tələb etməmisinizsə, bu emaili nəzərə almayın.</p>
              <div class="warning">
                ⚠️ Bu linki heç kimlə paylaşmayın!
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Cerez Shop. Bütün hüquqlar qorunur.</p>
              <p>Bu email avtomatik göndərilib, cavab verməyin.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Email dəyişmə təsdiqi göndərildi: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Email dəyişmə təsdiqi xətası:', error);
    return false;
  }
};

// ✅ YENİ - Email dəyişmə xəbərdarlığı (köhnə emailə)
export const sendEmailChangeNotification = async (to, name, cancelLink) => {
  try {
    await transporter.sendMail({
      from: `"Cerez Shop" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '⚠️ Email Dəyişdirmə Xəbərdarlığı',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Dəyişdirmə Xəbərdarlığı</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; margin: 20px 0; font-weight: bold; }
            .footer { background: #f8f8f8; padding: 15px; text-align: center; color: #888; font-size: 12px; }
            .warning { color: #e74c3c; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Email Dəyişdirmə Xəbərdarlığı</h1>
            </div>
            <div class="content">
              <p>Salam, <strong>${name || 'İstifadəçi'}</strong>,</p>
              <p>Hesabınızın email ünvanının dəyişdirilməsi üçün sorğu göndərilib.</p>
              <p><strong>Yeni email:</strong> təsdiq gözləyir</p>
              <p><strong>Bu əməliyyatı siz tələb etməmisinizsə, dərhal aşağıdakı düyməyə klikləyin:</strong></p>
              <div style="text-align: center;">
                <a href="${cancelLink}" class="button">❌ Əməliyyatı Ləğv Et</a>
              </div>
              <p>Əgər bu əməliyyatı siz tələb etmisinizsə, bu emaili nəzərə almayın.</p>
              <div class="warning">
                ⚠️ Hesabınızın təhlükəsizliyi üçün heç kimə icazə verməyin!
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Cerez Shop. Bütün hüquqlar qorunur.</p>
              <p>Bu email avtomatik göndərilib, cavab verməyin.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Email dəyişmə xəbərdarlığı göndərildi: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Email dəyişmə xəbərdarlığı xətası:', error);
    return false;
  }
};

// Test üçün email göndərmə
export const sendTestEmail = async (to) => {
  try {
    await transporter.sendMail({
      from: `"Cerez Shop" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Test Email',
      html: '<h1>Test</h1><p>Bu test emailidir.</p>'
    });
    console.log(`✅ Test email göndərildi: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Test email xətası:', error);
    return false;
  }
};