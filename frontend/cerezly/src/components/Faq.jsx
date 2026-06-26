import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next"; // i18n importu
import "./Faq.css";

const FAQ = () => {
  // i18n hook'ları - dil dəyişdirmə üçün
  const { t, i18n } = useTranslation();
  
  // Dilə görə dəyişən FAQ məlumatları
  const getFAQData = () => [
    {
      question: t('faq.deliveryCostQuestion'), // Çatdırılma haqqı nə qədərdir?
      answer: t('faq.deliveryCostAnswer')     // Çatdırılma haqqı sifarişin miqdarı və ünvanından asılı olaraq dəyişir.
    },
    {
      question: t('faq.howToOrderQuestion'),  // Sifariş necə verilir?
      answer: t('faq.howToOrderAnswer')       // İstər sayt üzərindən, istər WhatsApp və ya zənglə sifariş qəbul edilir.
    },
    {
      question: t('faq.deliveryTimeQuestion'), // Sifariş verdikdən sonra nə qədər müddətdə çatdırılır?
      answer: t('faq.deliveryTimeAnswer')      // Sifarişlər adətən 24 saat ərzində çatdırılır. Çatdırılma müddəti ünvan, bölgə və digər şərtlərdən asılı olaraq dəyişə bilər.
    },
    {
      question: t('faq.paymentMethodsQuestion'), // Ödəniş üsulları hansılardır?
      answer: t('faq.paymentMethodsAnswer')      // Nağd, kartla və ya onlayn ödəniş mümkündür.
    },
    {
      question: t('faq.wholesaleQuestion'),   // Topdan satış var?
      answer: t('faq.wholesaleAnswer')        // Xeyr, topdan satış mövcud deyil.
    },
    {
      question: t('faq.returnPolicyQuestion'), // Məhsulları qaytarmaq və ya dəyişdirmək olarmı?
      answer: t('faq.returnPolicyAnswer')      // Qida təhlükəsizliyi səbəbindən açılmış məhsulların qaytarılması mümkün deyil. Lakin yanlış və ya zədələnmiş məhsul olduqda, 24 saat ərzində müraciət edildiyi halda dəyişdirmə və ya geri qaytarma həyata keçirilir.
    }
  ];

  // State'lər - açıq FAQ indeksi və görünən elementlər
  const [openIndex, setOpenIndex] = useState(null);
  const [visibleItems, setVisibleItems] = useState([]);
  const [faqData, setFaqData] = useState(getFAQData()); // State'ə çevirdik

  // Dil dəyişdikdə FAQ məlumatlarını yenilə
  useEffect(() => {
    setFaqData(getFAQData());
  }, [i18n.language]); // Dil dəyişdikdə təkrar yüklə

  // Refləri yarat - faqData uzunluğuna görə
  const faqRefs = useRef(faqData.map(() => React.createRef()));
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const contactRef = useRef(null);

  // FAQ açıb-bağlama funksiyası
  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  // Scroll animasiyaları üçün IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // FAQ item'larını tap
            const index = faqRefs.current.findIndex(
              (ref) => ref.current === entry.target
            );

            if (index !== -1) {
              setTimeout(() => {
                setVisibleItems((prev) => [...new Set([...prev, index])]);
              }, index * 100);
            }

            // Başlıq və digər elementlərə animasiya əlavə et
            if (
              entry.target === titleRef.current ||
              entry.target === subtitleRef.current ||
              entry.target === contactRef.current
            ) {
              entry.target.classList.add("fade-in-up");
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    // Bütün FAQ item'larını observe et
    faqRefs.current.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    // Başlıq və digər elementləri observe et
    if (titleRef.current) observer.observe(titleRef.current);
    if (subtitleRef.current) observer.observe(subtitleRef.current);
    if (contactRef.current) observer.observe(contactRef.current);

    return () => observer.disconnect();
  }, [faqData]); // FAQ data dəyişdikdə observer yenilə

  return (
    <div className="faq-container faq-page" ref={containerRef}>
      
      {/* === BAŞLIQ HİSSƏSİ (FAQ Badge ilə) === */}
      <div ref={titleRef} className="faq-title-wrapper animate-on-scroll">
        <div className="faq-badge">{t('faq.badge')}</div> {/* "FAQ" badge'i */}
        <h2 className="faq-title">{t('faq.title')}</h2> {/* "Sizin Suallarınıza Cavab Veririk" */}
      </div>

      {/* === ALT BAŞLIQ === */}
      <p ref={subtitleRef} className="faq-subtitle animate-on-scroll">
        {t('faq.subtitle')} {/* "Ən çox verilən sualları burada tapa bilərsiniz. Əlavə sualınız varsa, bizimlə əlaqə saxlayın." */}
      </p>

      {/* === FAQ SİYAHISI === */}
      <div className="faq-list">
        {faqData.map((item, i) => (
          <div
            key={i}
            ref={faqRefs.current[i]}
            className={`faq-item ${openIndex === i ? "open" : ""} ${
              visibleItems.includes(i) ? "slide-in" : "hidden"
            }`}
            onClick={() => toggle(i)}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* === SUAL HİSSƏSİ === */}
            <div className="faq-question">
              <span>{item.question}</span>
              <div className={`arrow ${openIndex === i ? "rotate" : ""}`}>
                ❯
              </div>
            </div>

            {/* === CAVAB HİSSƏSİ (açılıb-bağlanan) === */}
            <div
              className="faq-answer"
              style={{
                maxHeight: openIndex === i ? "200px" : "0px"
              }}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>

      {/* === ƏLAQƏ HİSSƏSİ === */}
      <div ref={contactRef} className="faq-contact animate-on-scroll">
        <p>{t('faq.contactText')}</p> {/* "Sualınıza cavab tapa bilmədiniz?" */}
        <a href="/contact">{t('faq.contactLink')}</a> {/* "Bizimlə əlaqə saxlayın →" */}
      </div>
    </div>
  );
};

export default FAQ;