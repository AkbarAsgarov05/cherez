import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollRestoration = () => {
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    // Browser automatic scroll restore söndür
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Detail səhifələr həmişə yuxarı açılsın
    const forceTopRoutes = [
      "/kampaniya/",
      "/blog/",
      "/product/"
    ];

    const shouldForceTop = forceTopRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (shouldForceTop) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      // Şəkil və content sonradan yüklənirsə əlavə fix
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);

      return () => clearTimeout(timer);
    }

    // Digər səhifələr üçün scroll yadda saxla
    const savedPosition = sessionStorage.getItem(pathname);

    if (savedPosition !== null) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedPosition, 10),
          left: 0,
          behavior: "auto",
        });
      }, 50);
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      // Detail səhifələrin scroll-u yadda qalmasın
      if (!shouldForceTop) {
        sessionStorage.setItem(pathname, window.scrollY.toString());
      }
    };
  }, [pathname]);

  return null;
};

export default ScrollRestoration;