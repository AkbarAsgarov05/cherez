import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next"; // i18n importu
import "./Reviews.css";

/* ===== STARS COMPONENT (Dəyişməz qalır) ===== */
function Stars() {
  const starSvg = (
    <svg className="star" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <filter id="star-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="1"
            floodColor="#FFA500"
            floodOpacity="0.5"
          />
        </filter>
      </defs>
      <path
        d="M12 .587l3.668 7.568L24 9.748l-6 5.848L19.335 24 12 20.018 4.665 24 6 15.596 0 9.748l8.332-1.593z"
        fill="url(#gold-gradient)"
        stroke="#D2691E"
        strokeWidth="0.5"
        filter="url(#star-shadow)"
      />
    </svg>
  );

  return (
    <div className="stars">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="star-container">
            {starSvg}
          </div>
        ))}
    </div>
  );
}

/* ===== REVIEW CARD ===== */
function ReviewCard({ letter, name, role, text, index }) {
  const cardRef = useRef(null);
  const starsRef = useRef(null);
  const quoteRef = useRef(null);
  const textRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === cardRef.current)
              setTimeout(() => entry.target.classList.add("card-visible"), index * 100);

            if (entry.target === starsRef.current)
              setTimeout(() => entry.target.classList.add("stars-visible"), index * 100 + 200);

            if (entry.target === quoteRef.current)
              setTimeout(() => entry.target.classList.add("quote-visible"), index * 100 + 300);

            if (entry.target === textRef.current)
              setTimeout(() => entry.target.classList.add("text-visible"), index * 100 + 400);

            if (entry.target === profileRef.current)
              setTimeout(() => entry.target.classList.add("profile-visible"), index * 100 + 500);
          }
        });
      },
      { threshold: 0.2 }
    );

    [cardRef, starsRef, quoteRef, textRef, profileRef].forEach(
      (ref) => ref.current && observer.observe(ref.current)
    );

    return () => observer.disconnect();
  }, [index]);

  return (
    <div ref={cardRef} className="card card-hidden">
      <div className="stars-row">
        <div ref={starsRef} className="stars stars-hidden">
          <Stars />
        </div>
        <div ref={quoteRef} className="quote quote-hidden">❞</div>
      </div>

      <p ref={textRef} className="text text-hidden">"{text}"</p>

      <div ref={profileRef} className="profile profile-hidden">
        <div className="circle circle-hidden">{letter}</div>
        <div className="profile-info">
          <div className="name">{name}</div>
          <div className="role">{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN COMPONENT ===== */
export default function Reviews() {
  const { t } = useTranslation(); // i18n hook'u
  
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("fade-in-up");
        });
      },
      { threshold: 0.1 }
    );

    [badgeRef, titleRef, subtitleRef, containerRef].forEach(
      (ref) => ref.current && observer.observe(ref.current)
    );

    return () => observer.disconnect();
  }, []);

  // Rəy məlumatları - i18n ilə
  const reviewsData = [
    {
      letter: "A",
      name: t('reviews.review1.name'), // "Anonim Müştəri"
      role: t('reviews.review1.role'), // "Daimi Müştəri"
      text: t('reviews.review1.text')  // "Çərəzly-dən aldığım quru meyvələr həmişə təzə və keyfiyyətlidir."
    },
    {
      letter: "R",
      name: t('reviews.review2.name'), // "Anonim Müştəri"
      role: t('reviews.review2.role'), // "Restoran Sahibi"
      text: t('reviews.review2.text')  // "Restoranımız üçün hər həftə buradan sifariş veririk."
    },
    {
      letter: "G",
      name: t('reviews.review3.name'), // "Anonim Müştəri"
      role: t('reviews.review3.role'), // "Sağlam Qidalanma Həvəskarı"
      text: t('reviews.review3.text')  // "Məhsulların təbii olması və geniş çeşidi məni çox sevindirir."
    }
  ];

  return (
    <div className="reviews-wrapper">
      <div className="reviews-header">
        {/* 🔴 RƏYLƏR BADGE - i18n ilə */}
        <div ref={badgeRef} className="reviews-badge-wrapper animate-on-scroll">
          <div className="reviews-badge">{t('reviews.badge')}</div> {/* "RƏYLƏR" */}
        </div>

        {/* BAŞLIQ - i18n ilə */}
        <h1 ref={titleRef} className="title-hidden">
          {t('reviews.title')} {/* "Müştərilərimiz Nə Deyir?" */}
        </h1>

        {/* ALT BAŞLIQ - i18n ilə */}
        <p ref={subtitleRef} className="subtitle-hidden">
          {t('reviews.subtitle')} {/* "Minlərlə məmnun müştərimizin rəylərini oxuyun" */}
        </p>
      </div>

      {/* RƏYLƏR KONTEYNERİ */}
      <div ref={containerRef} className="reviews-container container-hidden">
        {reviewsData.map((review, index) => (
          <ReviewCard
            key={index}
            letter={review.letter}
            name={review.name}
            role={review.role}
            text={review.text}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}