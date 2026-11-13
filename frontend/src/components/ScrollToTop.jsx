import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    // back/forward (POP) par scroll na karo, page apna maqam khud restore karta ha
    if (navType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // navType dependency mein nahi: warna ?page= ya filter ke replace par bhi chal jayega
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
};

export default ScrollToTop;