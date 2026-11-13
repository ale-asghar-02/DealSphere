import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as TablerIcons from "@tabler/icons-react";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';

import useCategory from "../hooks/useCategory";
import { Shimmer } from "@/components/Shimmer";
import "../category.scss"

// loading pills ki widths (thodi alag alag, natural look ke liye)
const SKELETON_WIDTHS = [150, 120, 170, 130, 160, 140, 180, 125];

const CategoryItems = ({ activeCategorySlug }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, catLoading, handleDisplayCategory } = useCategory();

  // pehli fetch complete hone tak true (taake khali state ek second ke liye flash na ho)
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      await handleDisplayCategory();
      setInitialLoading(false);
    };
    loadCategories();
  }, []);

  // categories nahi aayi aur fetch chal rahi hai => shimmer
  const isLoading = (!category || category.length === 0) && (initialLoading || catLoading);

  // ✅ Active check: URL slug ya prop se aaya activeCategorySlug dono check karo
  const isActive = (cat, index) => {
    const urlSlug = location.pathname.replace("/advertisement", "");
    if (activeCategorySlug) {
      return cat.slug === activeCategorySlug;
    }
    return urlSlug === cat.slug || (location.pathname === "/" && index === 0);
  };

  return (
    <div className="d-flex flex-wrap flex-md-nowrap align-items-center overflow-hidden category-section">

      <div className="col-12 category pe-lg-3">
        {isLoading ? (
          // loading: pill shaped shimmers (same height 45px)
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            {SKELETON_WIDTHS.map((width, i) => (
              <Shimmer
                key={i}
                width={`${width}px`}
                height="45px"
                rounded="rounded-pill"
                className="flex-shrink-0"
              />
            ))}
          </div>
        ) : (
          <Swiper slidesPerView={'auto'} spaceBetween={8} modules={[Pagination]} className="mySwiper">

            {category && category.length > 0 && category.map((cat, index) => {
              const IconComponent = TablerIcons[cat.icon];

              return (
                <SwiperSlide key={cat._id} onClick={() => navigate(`/advertisement/${cat.slug}`)} className='category d-flex align-items-center' style={{ width: 'auto' }}>
                  <div
                    className={`d-flex align-items-center border rounded-pill category-item ${isActive(cat, index) ? "active" : ""}`}
                    style={{ width: 'fit-content', height: '45px', cursor: 'pointer', paddingInline: '5px' }}
                  >
                    <div className="d-flex align-items-center justify-content-center category-icon rounded-circle me-2" style={{ width: '35px', height: '35px' }}>
                      {IconComponent && <IconComponent stroke={1.3} size={22} color="white" />}
                    </div>
                    <p className="mb-0 me-3">{cat.name}</p>
                  </div>
                </SwiperSlide>
              );
            })}

          </Swiper>
        )}
      </div>

    </div>
  );
};

export default CategoryItems;