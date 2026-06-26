import React from "react";
import { useTranslation } from "react-i18next"; // ✅ namespace YOX
import Footer from "./Footer";
import "./TermsOfService.css";

const TermsOfService = () => {
  const { t } = useTranslation(); // ✅ Products.jsx-də olduğu KİMİ

  return (
    <>
      <div className="terms-page">
        <div className="terms-container">
          <h1 className="terms-title">{t("terms.title", "İstifadəçi Şərtləri")}</h1>
          <p className="terms-date">{t("terms.lastUpdated", "Son yenilənmə: 15 Yanvar 2025")}</p>

          <div className="terms-content">
            <p className="terms-intro">
              {t("terms.intro", "Cherez.az veb saytından istifadə etməklə, siz aşağıdakı istifadəçi şərtlərini qəbul etmiş olursunuz. Bu şərtlərlə razı deyilsinizsə, saytımızdan istifadə etməməyiniz xahiş olunur.")}
            </p>

            {/* Section 1 - Ümumi müddəalar */}
            <section className="terms-section">
              <h2>{t("terms.sections.general.title", "1. Ümumi müddəalar")}</h2>
              <p>{t("terms.sections.general.clause1", "1.1. Saytdan istifadə edən hər bir şəxs bu şərtlərlə razılaşmış hesab olunur.")}</p>
              <p>{t("terms.sections.general.clause2", "1.2. Mağaza bu şərtləri əvvəlcədən xəbərdarlıq etmədən dəyişdirmək hüququnu özündə saxlayır.")}</p>
            </section>

            {/* Section 2 - Qeydiyyat və istifadəçi hesabı */}
            <section className="terms-section">
              <h2>{t("terms.sections.registration.title", "2. Qeydiyyat və istifadəçi hesabı")}</h2>
              <p>{t("terms.sections.registration.clause1", "2.1. Sifariş vermək üçün istifadəçi qeydiyyatdan keçməlidir.")}</p>
              <p>{t("terms.sections.registration.clause2", "2.2. İstifadəçi təqdim etdiyi məlumatların düzgünlüyünə görə məsuliyyət daşıyır.")}</p>
              <p>{t("terms.sections.registration.clause3", "2.3. İstifadəçi öz hesab məlumatlarının məxfiliyini qorumağa borcludur.")}</p>
            </section>

            {/* Section 3 - Sifariş və ödəniş şərtləri */}
            <section className="terms-section">
              <h2>{t("terms.sections.orderPayment.title", "3. Sifariş və ödəniş şərtləri")}</h2>
              <p>{t("terms.sections.orderPayment.clause1", "3.1. Bütün qiymətlər AZN (Azərbaycan Manatı) ilə göstərilir.")}</p>
              <p>{t("terms.sections.orderPayment.clause2", "3.2. Qiymətlər əvvəlcədən xəbərdarlıq edilmədən dəyişdirilə bilər.")}</p>
              <p>{t("terms.sections.orderPayment.clause3", "3.3. Sifarişlər sayt vasitəsilə səbət sistemi üzərindən həyata keçirilir.")}</p>
              <p>{t("terms.sections.orderPayment.clause4", "3.4. Ödəniş yalnız sifarişin çatdırılması zamanı qəbul edilir.")}</p>
              <p>{t("terms.sections.orderPayment.clause5", "3.5. Saytda onlayn ödəniş sistemi mövcud deyil.")}</p>
            </section>

            {/* Section 4 - Çatdırılma qaydaları */}
            <section className="terms-section">
              <h2>{t("terms.sections.delivery.title", "4. Çatdırılma qaydaları")}</h2>
              <p>{t("terms.sections.delivery.clause1", "4.1. Çatdırılma müddəti sifarişin təsdiqindən sonra istifadəçiyə bildirilir və bu müddət təxmini xarakter daşıyır.")}</p>
              <p>{t("terms.sections.delivery.clause2", "4.2. İstifadəçi tərəfindən qeyd edilən ünvanın düzgün olmaması halında yaranan gecikmələrə görə şirkət məsuliyyət daşımır.")}</p>
              <p>{t("terms.sections.delivery.clause3", "4.3. Çatdırılma zamanı məhsul istifadəçiyə təqdim edilərkən yoxlanılmalı və hər hansı uyğunsuzluq aşkar edildikdə dərhal bildirilməlidir.")}</p>
            </section>

            {/* Section 5 - Məhsullar və məsuliyyət */}
            <section className="terms-section">
              <h2>{t("terms.sections.products.title", "5. Məhsullar və məsuliyyət")}</h2>
              <p>{t("terms.sections.products.clause1", "5.1. Saytın texniki problemlər səbəbindən müvəqqəti olaraq dayandırılması halında məsuliyyət daşımırıq.")}</p>
              <p>{t("terms.sections.products.clause2", "5.2. Saytda yerləşdirilən məhsul şəkilləri məlumat xarakterlidir.")}</p>
              <p>{t("terms.sections.products.clause3", "5.3. Mövcudluq və qiymətlər əvvəlcədən xəbərdarlıq edilmədən dəyişdirilə bilər.")}</p>
            </section>

            {/* Section 6 - Məsuliyyətin məhdudlaşdırılması */}
            <section className="terms-section">
              <h2>{t("terms.sections.liability.title", "6. Məsuliyyətin məhdudlaşdırılması")}</h2>
              <p>{t("terms.sections.liability.clause1", "6.1. Mağaza istifadəçinin səhv və ya natamam məlumat təqdim etməsi nəticəsində yaranan problemlərə görə məsuliyyət daşımır.")}</p>
              <p>{t("terms.sections.liability.clause2", "6.2. Mağaza texniki nasazlıqlar nəticəsində xidmətin müvəqqəti dayandırılmasına görə məsuliyyət daşımır.")}</p>
            </section>

            {/* Section 7 - Geri qaytarma və dəyişdirmə */}
            <section className="terms-section">
              <h2>{t("terms.sections.return.title", "7. Geri qaytarma və dəyişdirmə şərtləri")}</h2>
              <p>{t("terms.sections.return.clause1", "7.1. Qida təhlükəsizliyi səbəbindən açılmış məhsulların qaytarılması mümkün deyil.")}</p>
              <p>{t("terms.sections.return.clause2", "7.2. Yalnız aşağıdakı hallarda istisna tətbiq oluna bilər:")}</p>
              <ul>
                <li>{t("terms.sections.return.list.damaged", "Məhsul xarab, keyfiyyətsiz və ya zədələnmiş olduqda")}</li>
                <li>{t("terms.sections.return.list.wrongProduct", "Sifariş veriləndən fərqli məhsul təqdim edildikdə")}</li>
              </ul>
              <p>{t("terms.sections.return.clause3", "7.3. Belə hallarda istifadəçi məhsulu qəbul etdiyi anda və ya ən gec 24 saat ərzində mağaza ilə əlaqə saxlamalıdır.")}</p>
              <p>{t("terms.sections.return.clause4", "7.4. Mağaza müraciəti araşdırdıqdan sonra məhsulun dəyişdirilməsi və ya geri götürülməsi barədə qərar verir.")}</p>
            </section>

            {/* Section 8 - Ləğv etmə */}
            <section className="terms-section">
              <h2>{t("terms.sections.cancellation.title", "8. Ləğv etmə")}</h2>
              <p>{t("terms.sections.cancellation.clause1", "8.1. İstifadəçi sifarişi yalnız çatdırılma həyata keçirilməmişdən əvvəl ləğv edə bilər.")}</p>
              <p>{t("terms.sections.cancellation.clause2", "8.2. Çatdırılma prosesinə başlanıldıqdan sonra sifarişin ləğvi mümkün olmaya bilər.")}</p>
            </section>

            {/* Section 9 - Şərtlərin Dəyişdirilməsi */}
            <section className="terms-section">
              <h2>{t("terms.sections.changes.title", "9. Şərtlərin Dəyişdirilməsi")}</h2>
              <p>{t("terms.sections.changes.clause1", "9.1. Mağaza bu İstifadəçi Şərtlərini istənilən vaxt dəyişdirmək hüququnu özündə saxlayır. Dəyişikliklər saytda yerləşdirildiyi andan etibarən qüvvəyə minir.")}</p>
            </section>

            {/* Əlaqə bölməsi */}
            <div className="terms-contact">
              <h3>{t("terms.contact.title", "Əlaqə")}</h3>
              <p>{t("terms.contact.description", "İstifadəçi Şərtlərimiz haqqında hər hansı sualınız olarsa, bizimlə əlaqə saxlayın:")}</p>
              <p><strong>{t("terms.contact.emailLabel", "Email")}:</strong> info@cerez.az</p>
              <p><strong>{t("terms.contact.phoneLabel", "Telefon")}:</strong> +994 50 123 45 67</p>
              <p><strong>{t("terms.contact.addressLabel", "Ünvan")}:</strong> {t("terms.contact.address", "Bakı, Azərbaycan")}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfService;