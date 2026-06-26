import React from "react";
import { useTranslation } from "react-i18next"; // ✅ namespace YOX
import Footer from "./Footer";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  const { t } = useTranslation(); // ✅ Products.jsx-də olduğu KİMİ

  return (
    <>
      <div className="privacy-policy-page">
        <div className="privacy-policy-container">
          {/* ✅ Products.jsx-də olduğu kimi t("açar", "default") formatı */}
          <h1 className="privacy-policy-title">{t("privacy.title", "Məxfilik Siyasəti")}</h1>
          <p className="privacy-policy-date">{t("privacy.lastUpdated", "Son yenilənmə: 15 Yanvar 2025")}</p>

          <div className="privacy-policy-content">
            <p className="privacy-policy-intro">
              {t("privacy.intro", "Bu Məxfilik Siyasəti Cherez.az tərəfindən təqdim olunan xidmətlərdən istifadə edən şəxslərin şəxsi məlumatlarının toplanması, işlənməsi və qorunması qaydalarını müəyyən edir.")}
            </p>

            {/* Section 1 - Ümumi müddəalar */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.general.title", "1. Ümumi müddəalar")}</h2>
              <p>{t("privacy.sections.general.clause1", "1.1. Saytdan istifadə etməklə istifadəçi bu Məxfilik Siyasətinin şərtlərini qəbul etmiş hesab olunur.")}</p>
              <p>{t("privacy.sections.general.clause2", "1.2. İstifadəçi təqdim etdiyi məlumatların düzgün və aktual olmasına görə məsuliyyət daşıyır.")}</p>
            </section>

            {/* Section 2 - Toplanan məlumatlar */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.collectedData.title", "2. Toplanan məlumatlar")}</h2>
              <p>{t("privacy.sections.collectedData.clause1", "2.1. İstifadəçi tərəfindən könüllü şəkildə təqdim edilən aşağıdakı məlumatlar toplanıla bilər:")}</p>
              <ul>
                <li>{t("privacy.sections.collectedData.list.name", "Ad, soyad")}</li>
                <li>{t("privacy.sections.collectedData.list.phone", "Əlaqə nömrəsi")}</li>
                <li>{t("privacy.sections.collectedData.list.address", "Çatdırılma ünvanı")}</li>
                <li>{t("privacy.sections.collectedData.list.email", "Elektron poçt ünvanı (əgər təqdim olunubsa)")}</li>
                <li>{t("privacy.sections.collectedData.list.orderInfo", "Sifariş məlumatları")}</li>
              </ul>
            </section>

            {/* Section 3 - Məlumatların emal məqsədləri */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.purposes.title", "3. Məlumatların emal məqsədləri")}</h2>
              <p>{t("privacy.sections.purposes.clause1", "3.1. Toplanan məlumatlar aşağıdakı məqsədlərlə istifadə olunur:")}</p>
              <ul>
                <li>{t("privacy.sections.purposes.list.orderProcessing", "Sifarişlərin qəbul edilməsi və icrası")}</li>
                <li>{t("privacy.sections.purposes.list.delivery", "Çatdırılmanın təmin edilməsi")}</li>
                <li>{t("privacy.sections.purposes.list.contact", "İstifadəçi ilə əlaqə saxlanılması")}</li>
                <li>{t("privacy.sections.purposes.list.quality", "Xidmət keyfiyyətinin artırılması")}</li>
                <li>{t("privacy.sections.purposes.list.marketing", "Marketinq və məlumatlandırma (istifadəçinin razılığı əsasında)")}</li>
              </ul>
            </section>

            {/* Section 4 - Məlumatların qorunması və saxlanması */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.protection.title", "4. Məlumatların qorunması və saxlanması")}</h2>
              <p>{t("privacy.sections.protection.clause1", "4.1. Şirkət istifadəçi məlumatlarının qorunması üçün müvafiq texniki və təşkilati tədbirlər həyata keçirir.")}</p>
              <p>{t("privacy.sections.protection.clause2", "4.2. Şəxsi məlumatlar qanunvericiliyin tələblərinə uyğun şəkildə saxlanılır və qorunur.")}</p>
            </section>

            {/* Section 5 - Üçüncü tərəflərə ötürülmə */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.thirdParty.title", "5. Üçüncü tərəflərə ötürülmə")}</h2>
              <p>{t("privacy.sections.thirdParty.clause1", "5.1. İstifadəçi məlumatları aşağıdakı hallarda üçüncü tərəflərə ötürülə bilər:")}</p>
              <ul>
                <li>{t("privacy.sections.thirdParty.list.deliveryService", "Çatdırılma xidmətinin həyata keçirilməsi üçün")}</li>
                <li>{t("privacy.sections.thirdParty.list.legalRequirement", "Qanunvericiliklə tələb olunduqda")}</li>
              </ul>
              <p>{t("privacy.sections.thirdParty.clause2", "5.2. Digər hallarda məlumatlar istifadəçinin razılığı olmadan paylaşılmır.")}</p>
            </section>

            {/* Section 6 - Məlumatların Təhlükəsizliyi */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.security.title", "6. Məlumatların Təhlükəsizliyi")}</h2>
              <p>{t("privacy.sections.security.clause1", "6.1. Məlumatlarınızın təhlükəsizliyini təmin etmək üçün müasir şifrələmə texnologiyalarından (SSL) istifadə edirik.")}</p>
              <p>{t("privacy.sections.security.clause2", "6.2. Şəxsi məlumatlarınız qorunan serverlərdə saxlanılır və yalnız icazəli personal tərəfindən əldə edilə bilər.")}</p>
            </section>

            {/* Section 7 - Kukilər */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.cookies.title", "7. Kukilər (Cookies)")}</h2>
              <p>{t("privacy.sections.cookies.clause1", "7.1. Sayt istifadəçi təcrübəsini yaxşılaşdırmaq məqsədilə kukilərdən istifadə edə bilər.")}</p>
            </section>

            {/* Section 8 - İstifadəçi hüquqları */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.userRights.title", "8. İstifadəçi hüquqları")}</h2>
              <p>{t("privacy.sections.userRights.clause1", "8.1. İstifadəçi aşağıdakı hüquqlara malikdir:")}</p>
              <ul>
                <li>{t("privacy.sections.userRights.list.access", "Öz məlumatlarına çıxış əldə etmək")}</li>
                <li>{t("privacy.sections.userRights.list.correction", "Məlumatların düzəldilməsini və ya silinməsini tələb etmək")}</li>
                <li>{t("privacy.sections.userRights.list.objection", "Məlumatların emalına etiraz etmək")}</li>
              </ul>
            </section>

            {/* Section 9 - Dəyişikliklər */}
            <section className="privacy-section">
              <h2>{t("privacy.sections.changes.title", "9. Dəyişikliklər")}</h2>
              <p>{t("privacy.sections.changes.clause1", "9.1. Bu Məxfilik Siyasətində vaxtaşırı dəyişikliklər edilə bilər.")}</p>
              <p>{t("privacy.sections.changes.clause2", "9.2. Dəyişikliklər saytda yerləşdirildiyi andan etibarən qüvvəyə minir.")}</p>
            </section>

            {/* Əlaqə bölməsi */}
            <div className="privacy-contact">
              <h3>{t("privacy.contact.title", "Əlaqə")}</h3>
              <p>{t("privacy.contact.description", "Məxfilik Siyasətimiz haqqında hər hansı sualınız olarsa, bizimlə əlaqə saxlayın:")}</p>
              <p><strong>{t("privacy.contact.emailLabel", "Email")}:</strong> info@cerez.az</p>
              <p><strong>{t("privacy.contact.phoneLabel", "Telefon")}:</strong> +994 50 123 45 67</p>
              <p><strong>{t("privacy.contact.addressLabel", "Ünvan")}:</strong> {t("privacy.contact.address", "Bakı, Azərbaycan")}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;