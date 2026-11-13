import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { IconStarFilled, IconCash, IconClock, IconMapPin, IconArrowRight, IconPlus, IconX } from '@tabler/icons-react';
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import ContactSellerButton from '../components/ContactSellerButton';
import ItemChatButton from '../../chat/components/ItemChatButton'
import WishlistButton from '../../wishlist/components/WishlistButton';
import { Shimmer, NoImage } from '@/components/Shimmer'

// pageMarker = us page ka number jis ka ye pehla card ha (infinite scroll ke URL sync ke liye)
const AdvertisementCard = ({ ad = {}, pageMarker }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ad._id nahi hai => loading state (shimmer)
  const isLoading = !ad._id;

  const [showImages, setShowImages] = useState(false);
  const [renderImages, setRenderImages] = useState(false); // stays true during closing transition
  const closeTimeoutRef = useRef(null);

  const toggleImages = () => {
    if (showImages) {
      // closing: keep Swiper mounted until the 0.4s CSS transition finishes
      setShowImages(false);
      closeTimeoutRef.current = setTimeout(() => setRenderImages(false), 400);
    } else {
      // opening: mount immediately, then trigger the transition
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setRenderImages(true);
      setShowImages(true);
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // model field "adsImages" hai, har item ek object hai: { url, public_id }
  const images = ad.adsImages?.slice(1) || [];
  const mainImage = ad.adsImages?.[0]?.url;

  function timeAgo(date) {
    if (!date) return "";

    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = [
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "min", seconds: 60 },
    ];
    for (let i = 0; i < intervals.length; i++) {
      const interval = Math.floor(seconds / intervals[i].seconds);
      if (interval >= 1) {
        return interval + " " + intervals[i].label + (interval > 1 ? "s" : "");
      }
    }
    return "just now";
  }

  const handleViewAd = () => {
    if (!ad._id) return;

    const categorySlug = ad.category?.slug;
    const subSlug = ad.subCategory?.slug || 'all'; // placeholder jab subcategory na ho

    navigate({
      pathname: `/advertisement/${categorySlug}/${subSlug}/${encodeURIComponent(ad.title)}-${ad._id}`,
      search: location.search,
    });
  };

  return (
    <div
      className="col-12 d-flex flex-wrap align-items-center pb-2 border-bottom mb-3 advertisement-card"
      data-page-marker={pageMarker}
    >
      <div className="col-12 col-md-5 col-xl-4 position-relative border rounded-3 mb-2" style={{ height: "clamp(180px, 20vw, 220px)" }}>
        {mainImage ? (
          <img className="w-100 h-100 object-fit-cover rounded-3" src={mainImage} alt="card-image" />
        ) : (
          // loading: shimmer bg + center mein "No Image Available"
          // loaded (image nahi): grey bg + center mein "No Image Available"
          <NoImage loading={isLoading} className="rounded-3" />
        )}

        {!isLoading && ad.isFeatured && (
          <span className="badge bg-warning text-dark fw-medium rounded-1 py-2 position-absolute top-0 start-0 m-2">
            <IconStarFilled size={12} className='me-1' style={{ marginBottom: '1px'}} />Featured
          </span>
        )}

        {!isLoading && (
          <span className="badge bg-dark bg-opacity-75 text-white fw-normal rounded-1 py-2 position-absolute bottom-0 end-0 m-2 d-flex align-items-center gap-1">
            <span>views : </span>
            {ad.views ?? 0}
          </span>
        )}
      </div>

      <div className="col-12 col-md-7 col-xl-8 ps-md-3 mb-2">
        {isLoading ? (
          <>
            {/* Title */}
            <Shimmer width="75%" height="24px" className="mb-3" />

            {/* Price + Created At */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
              <Shimmer width="130px" height="18px" />
              <Shimmer width="150px" height="18px" />
            </div>

            {/* Location */}
            <Shimmer width="90%" height="18px" className="mb-3" />

            {/* Buttons row */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <Shimmer width="110px" height="34px" />
                <Shimmer width="90px" height="34px" />
                <Shimmer width="34px" height="34px" />
              </div>
              <div className="d-flex align-items-center gap-3">
                <Shimmer width="80px" height="18px" />
                <Shimmer width="100px" height="18px" />
                <Shimmer width="26px" height="26px" />
              </div>
            </div>
          </>
        ) : (
          <>
            <h5
              className="col-12 overflow-hidden text-truncate text-wrap mb-3"
              style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "1.5em" }}
            >{ad.title}</h5>

            <div className="col d-flex flex-wrap align-items-center">
              <p className="d-flex flex-wrap align-items-center gap-2 text-secondary mb-0 me-3 me-lg-5">
                <IconCash stroke={1.5} size={20} />
                <span>Price : </span>
                <span className="text-dark">Rs {ad.price}</span>
              </p>
              <p className="d-flex flex-wrap align-items-center gap-2 text-secondary mb-0">
                <IconClock stroke={1.5} size={18} />
                <span>Created At :</span>
                <span className="text-dark">{timeAgo(ad.createdAt)}</span>
              </p>
            </div>

            <div className="col-12" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              <p className="text-secondary">
                <IconMapPin
                  stroke={1.5}
                  size={18}
                  className="flex-shrink-0"
                  style={{ marginBottom : '2px' }}
                />
                <span className="flex-shrink-0 mx-2">Location :</span>
                <span
                  className="text-dark"
                  style={{ minWidth: 0, wordBreak: "break-word" }}
                >
                  {[ad.address, ad.city, ad.country].filter(Boolean).join(", ")}
                </span>
              </p>
            </div>

            <div className="col-12 d-flex flex-wrap align-items-center">
              <div className="col d-flex align-items-center mb-2">
                <div className="d-flex align-items-center gap-2 me-5">
                  <ContactSellerButton ad={ad} />
                  <ItemChatButton ad={ad} />
                </div>

                <WishlistButton ad={ad} />
              </div>

              <div className="col d-flex align-items-center justify-content-end">
                <a className="icon-link icon-link-hover me-3" onClick={handleViewAd} style={{ cursor: 'pointer' }}>
                  View Ads
                  <IconArrowRight stroke={1.5} size={16} className="ms-1" />
                </a>
                <p className="text-nowrap mb-0 me-3">View Images</p>
                <button className="btn border border-dark text-dark d-flex align-items-center justify-content-center rounded-1 p-0" onClick={toggleImages} style={{ width: "26px", height: "26px" }}>
                  {showImages ? <IconX stroke={1.5} size={20} /> : <IconPlus stroke={1.5} size={20} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {!isLoading && (
        <div className={`col-12 d-flex gap-2 dropdown-images-wrapper ${showImages ? "show-images" : ""}`}>
          {renderImages && (
            <Swiper
              className="w-100"
              spaceBetween={10}
              slidesPerView={1}
              breakpoints={{
                576: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                992: { slidesPerView: 3 },
                1200: { slidesPerView: 5 },
              }}
            >
              {images.map((img, index) => (
                <SwiperSlide key={img.public_id || index}>
                  <div className="border bg-body-secondary rounded-2 d-flex align-items-center justify-content-center" style={{ height: "150px" }}>
                    <img src={img.url} alt="card-image" className="w-100 h-100 rounded-2" style={{ objectFit: "cover" }} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      )}

    </div>
  );
};

export default AdvertisementCard;