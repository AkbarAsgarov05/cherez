import React, { useEffect } from "react";
import "./About.css";
import { FaLeaf, FaHeart, FaTruck, FaMedal } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const About = ({ isPage }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const elements = document.querySelectorAll(".animate-about");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    elements.forEach((el) => observer.observe(el));
  }, []);

  return (
    <div className={`about-container ${isPage ? "about-page" : ""}`} id="about"> {/* ✅ ID ƏLAVƏ ETDİM */}
      <h4 className="about-subtitle about-badge animate-about delay-0">
        {t("about.subtitle", "Haqqımızda")}
      </h4>

      <h2 className="about-title animate-about delay-1">
        {t("about.whyChooseUs", "Niyə Bizi Seçməlisiniz?")}
      </h2>

      <p className="about-desc animate-about delay-2">
        {t("about.description", "10 ildən artıq təcrübə ilə, biz sizə ən keyfiyyətli məhsulları təqdim edirik. Hər məhsul diqqətlə seçilir və paketlənir.")}
      </p>

      <div className="about-cards">
        <div className="about-card animate-about delay-0">
          <FaLeaf className="about-icon box-animate" />
          <h3>{t("about.natural", "100% Təbii")}</h3>
          <p>{t("about.naturalDesc", "Heç bir kimyəvi əlavə olmadan, təmiz təbiət məhsulları")}</p>
        </div>

        <div className="about-card animate-about delay-1">
          <FaHeart className="about-icon heart-animate" />
          <h3>{t("about.health", "Sağlamlıq Üçün")}</h3>
          <p>{t("about.healthDesc", "Vitamin və minerallarla zəngin, orqanizmə faydalı")}</p>
        </div>

        <div className="about-card animate-about delay-2">
          <FaTruck className="about-icon truck-animate" />
          <h3>{t("about.fastDelivery", "Sürətli Çatdırılma")}</h3>
          <p>{t("about.deliveryDesc", "Bakı və regionlara çatdırılma xidməti")}</p>
        </div>

        <div className="about-card animate-about delay-3">
          <FaMedal className="about-icon star-animate" />
          <h3>{t("about.quality", "Keyfiyyət Zəmanəti")}</h3>
          <p>{t("about.qualityDesc", "Etibarlı mənbələrdən diqqətlə seçilmiş premium keyfiyyətli məhsullar")}</p>
        </div>
      </div>

      <div className="history-section">
        <div className="history-text animate-about delay-1">
          <h2>{t("about.ourStory", "Bizim Hekayəmiz")}</h2>
          <p>
            {t("about.storyPart1", "Bizim çərəz mağazamızın əsas məqsədi müştərilərimizə yüksək keyfiyyətli, təbii və dadlı məhsullar təqdim etməkdir. Hər bir çərəz diqqətlə seçilmiş xammallardan hazırlanır və müasir gigiyena standartlarına uyğun şəkildə sizə çatdırılır.")}
          </p>

          <p>
            {t("about.storyPart2", "Müştəri məmnuniyyəti bizim üçün ən önəmli prioritetdir. Sifarişdən çatdırılmaya qədər bütün mərhələlərdə sizə rahat və etibarlı xidmət göstərməyə çalışırıq.")}
          </p>

          <p>
            {t("about.storyPart3", "Sizə ən yaxşısını təqdim etmək üçün daim inkişaf edir və məhsul çeşidimizi genişləndiririk. Bizi seçdiyiniz üçün təşəkkür edirik!")}
          </p>
        </div>

        <div className="history-stats">
          <div className="stat-card animate-about delay-0">
            <h1>10+</h1>
            <p>{t("about.yearsExperience", "İllik Təcrübə")}</p>
          </div>

          <div className="stat-card animate-about delay-1">
            <h1>500+</h1>
            <p>{t("about.products", "Məhsul Növü")}</p>
          </div>

          <div className="stat-card animate-about delay-2">
            <h1>10K+</h1>
            <p>{t("about.satisfiedCustomers", "Razı Müştəri")}</p>
          </div>

          <div className="stat-card animate-about delay-3">
            <h1>24/7</h1>
            <p>{t("about.support", "Dəstək")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;