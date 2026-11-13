import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { IconPhoto, IconShare3, IconCheck, IconCopy, IconMapPin, IconWorld, IconClock, IconAd, IconPhone, IconPhoneOff, IconMessageDots, IconChevronRight, IconStarFilled } from "@tabler/icons-react";

import { useAuth } from "../../auth/hooks/useAuth";
import useAdvertisement from "../hooks/useAdvertisement";
import RelativeAdCard, { RelativeAdSkeletonRow } from "../components/RelativeAdCard";
import Modal from "@/components/Model";
import { Shimmer, NoImage } from "@/components/Shimmer";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import ReportAction from "@/components/ReportAction";
import SearchBar from "@/features/search/components/SearchBar";
import CategoryItems from "@/features/category/pages/CategoryItems";
import WishlistButton from "../../wishlist/components/WishlistButton";

import defaultUser from "@/assets/images/default_user.avif";
import promotion_DealSphere from "@/assets/images/promotion_DealSphere.png"
import banner_DealSphere from "@/assets/images/banner_DealSphere.png"

const timeAgo = (date) => {
  if (!date) return "N/A";

  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "min", seconds: 60 },
  ];

  for (const { label, seconds: unit } of intervals) {
    const count = Math.floor(seconds / unit);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""}`;
  }

  return "just now";
};

const SingleAdvertisement = () => {
  const { adSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { ads: ad, adLoading, activeAdsCount, relativeAds, handleGetSingleAds, handleGetRelativeAds } = useAdvertisement();

  const adId = adSlug?.split("-").pop();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showPhone, setShowPhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // loading state: jab tak ad ka _id nahi aata
  const isLoaded = !!ad?._id;

  // Featured field ka naam apne model ke hisaab se badal lein (isFeatured / featured)
  const isFeatured = !!(ad?.isFeatured || ad?.featured);

  useEffect(() => {
    if (adId) handleGetSingleAds({ id: adId });
    window.scrollTo(0, 0);
  }, [adId]);

  useEffect(() => {
    if (ad?._id && ad?.category?._id) {
      handleGetRelativeAds({ categoryId: ad.category._id, currentId: ad._id });
    }
  }, [ad]);

  useEffect(() => {
    setCurrentSlide(1);
    setShowPhone(false);
    setShowFullDescription(false);
  }, [ad?._id]);

  // Description ki limit height se tay hoti hai: 50vh se lambi ho to clamp + "See More"
  const description = ad?.description || "";
  const descRef = useRef(null);
  const [descLines, setDescLines] = useState(0); // 50vh me kitni lines aati hain
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const el = descRef.current;
      if (!el) return;

      const maxHeight = window.innerHeight * 0.5; // 50vh
      const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight) || 27;

      setDescLines(Math.max(1, Math.floor(maxHeight / lineHeight)));
      setIsDescriptionLong(el.scrollHeight > maxHeight + 1);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [description, isLoaded]);

  const isClamped = !showFullDescription && isDescriptionLong && descLines > 0;

  const images = ad?.adsImages?.map((img) => img.url) || [];

  const swiperHeight = () => (window.innerWidth < 768 ? "300px" : "510px");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleChatClick = () => {
    if (!user) return toast.error("Please login to continue.");
    if (!ad?._id) return;

    if (user._id?.toString() === (ad.seller?._id || ad.seller)?.toString()) {
      return toast.error("You cannot chat on your own advertisement");
    }

    navigate(`/chat/${ad._id}?seller=${ad.seller._id}&type=advertisement`);
  };

  const handleViewSellerProfile = () => {
    if (!ad?.seller?._id) return;

    navigate({
      pathname: `${location.pathname}/profile/${ad.seller.username}-${ad.seller._id}`,
      search: location.search,
    });
  };

  return (
    <div className="overflow-hidden">
      <Navbar />

      <div className="container-fluid d-flex flex-wrap flex-md-nowrap align-items-center mx-lg-2 py-1 mb-3">
        <SearchBar type="ads" searchPath="/advertisement" wrapperClassName="col-md-5 col-lg-4 me-md-2" />
        <CategoryItems />
      </div>

      <div className="container-fluid pb-5">
        <nav className="px-lg-2 mb-3">
          <div className="d-flex align-items-center flex-wrap gap-1 text-secondary" style={{ fontSize: "14px" }}>
            <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>

            {!isLoaded ? (
              <>
                <IconChevronRight size={14} />
                <Shimmer width="90px" height="14px" />
                <IconChevronRight size={14} />
                <Shimmer width="110px" height="14px" />
              </>
            ) : (
              <>
                {ad?.category && (
                  <>
                    <IconChevronRight size={14} />
                    <span style={{ cursor: "pointer" }} onClick={() => navigate(`/advertisement/${ad.category.slug}`)}>{ad.category.name}</span>
                  </>
                )}

                {ad?.subCategory && (
                  <>
                    <IconChevronRight size={14} />
                    <span className="text-dark" style={{ cursor: "pointer" }} onClick={() => navigate(`/advertisement/${ad.category?.slug}/${ad.subCategory.slug}`)}>{ad.subCategory.name}</span>
                  </>
                )}
              </>
            )}
          </div>
        </nav>

        <div className="row g-4 px-lg-2">
          <div className="col-12 col-lg-8 col-xl-8">
            <div className="card border-0">
              {isLoaded && images.length > 0 ? (
                <Swiper
                  key={ad?._id}
                  className="border rounded-3 mb-3"
                  modules={[Pagination, Autoplay, Navigation]}
                  pagination={{ dynamicBullets: true }}
                  navigation={true}
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  loop={images.length > 1}
                  onSlideChange={(swiper) => setCurrentSlide(swiper.realIndex + 1)}
                  style={{ width: "100%", height: swiperHeight(), position: "relative", backgroundColor: "#000" }}
                >
                  {images.map((img, index) => (
                    <SwiperSlide
                      key={index}
                      className="d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: "#000" }}
                    >
                      <img src={img} alt={`slide-${index}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </SwiperSlide>
                  ))}

                  {/* Top right: Featured badge (left) + Photos counter (right) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isFeatured && (
                      <div
                        style={{
                          background: "#f5a623",
                          color: "#fff",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <IconStarFilled size={14} />
                        Featured
                      </div>
                    )}

                    <div
                      style={{
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <IconPhoto size={15} />
                      {currentSlide} / {images.length} Photos
                    </div>
                  </div>
                </Swiper>
              ) : (
                // loading: shimmer bg + center mein "No Image Available"
                // loaded (image nahi): grey bg + center mein "No Image Available"
                <div className="border rounded-3 mb-3 overflow-hidden" style={{ width: "100%", height: swiperHeight() }}>
                  <NoImage loading={!isLoaded} textSize="18px" />
                </div>
              )}

              <div className="col-12 mb-2">
                {isLoaded ? (
                  <h3 className="text-break fw-semibold">{ad?.title}</h3>
                ) : (
                  <Shimmer width="70%" height="32px" className="mb-3" />
                )}

                <div className="col-12 d-flex align-items-center justify-content-between">
                  {isLoaded ? (
                    <h4 className="mb-0 fw-semibold">Rs : <span>{ad?.price?.toLocaleString()}</span></h4>
                  ) : (
                    <Shimmer width="160px" height="28px" />
                  )}

                  <div className="d-flex align-items-center gap-2">
                    {isLoaded ? (
                      <>
                        <WishlistButton ad={ad} />

                        <button
                          type="button"
                          className="btn btn-outline-dark d-flex align-items-center justify-content-center rounded-circle p-0"
                          style={{ width: "40px", height: "40px" }}
                          onClick={() => {
                            setCopied(false);
                            setShowShareModal(true);
                          }}
                        >
                          <IconShare3 stroke={1.5} size={21} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Shimmer width="40px" height="40px" rounded="rounded-circle" />
                        <Shimmer width="40px" height="40px" rounded="rounded-circle" />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isLoaded ? (
                <>
                  <div className="col-12">
                    <p className="text-secondary mb-2">
                      <IconMapPin stroke={1.5} size={18} className="text-primary flex-shrink-0" style={{ marginBottom: "2px" }} />
                      <span className="flex-shrink-0 mx-2">Location :</span>
                      <span className="text-dark" style={{ minWidth: 0, wordBreak: "break-word" }}>{ad?.address || "N/A"}</span>
                    </p>
                  </div>

                  <div className="col-12 d-flex flex-wrap align-items-center justify-content-between mb-3">
                    <div className="d-flex flex-wrap align-items-center me-2">
                      {ad?.country && (
                        <p className="d-flex flex-wrap align-items-center gap-2 text-secondary mb-0 me-3 me-lg-5">
                          <IconWorld stroke={1.5} size={18} className="text-primary" />
                          <span>Country :</span>
                          <span className="text-dark">{ad.country?.name || ad.country}</span>
                        </p>
                      )}

                      {ad?.city && (
                        <p className="d-flex flex-wrap align-items-center gap-2 text-secondary mb-0">
                          <IconMapPin stroke={1.5} size={18} className="text-primary" />
                          <span>City :</span>
                          <span className="text-dark">{ad.city?.name || ad.city}</span>
                        </p>
                      )}
                    </div>

                    <p className="d-flex flex-wrap align-items-center gap-2 text-secondary mb-0">
                      <IconClock stroke={1.5} size={18} className="text-primary" />
                      <span>Created At :</span>
                      <span className="text-dark">{timeAgo(ad?.createdAt)}</span>
                    </p>
                  </div>

                  <div className="col-12 d-flex align-items-center gap-2 flex-wrap mb-3">
                    <p className="mb-0 me-2" style={{ fontSize: "18px" }}>Condition</p>

                    {ad?.condition && <p className="mb-0 text-secondary-emphasis border border-secondary-subtle rounded-1 px-2">{ad.condition}</p>}
                    {ad?.status && <p className="mb-0 border rounded-1 px-2 text-success border-success">{ad.status}</p>}
                  </div>
                </>
              ) : (
                <>
                  {/* Location */}
                  <Shimmer width="85%" height="18px" className="mt-3 mb-3" />

                  {/* Country + City + Created At */}
                  <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <Shimmer width="130px" height="18px" />
                      <Shimmer width="110px" height="18px" />
                    </div>
                    <Shimmer width="140px" height="18px" />
                  </div>

                  {/* Condition */}
                  <div className="col-12 d-flex align-items-center gap-2 mb-3">
                    <Shimmer width="80px" height="22px" />
                    <Shimmer width="70px" height="24px" />
                    <Shimmer width="70px" height="24px" />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-4 col-xl-4">
            <div className="card border-0">
              <div className="border rounded-3 p-3 mb-3">
                {isLoaded ? (
                  <>
                    <div onClick={handleViewSellerProfile} className="d-flex align-items-center gap-3" style={{ width: "fit-content", cursor: "pointer" }}>
                      <img src={ad?.seller?.userImage || defaultUser} alt="user" className="border rounded-circle" style={{ width: "60px", height: "60px", objectFit: "cover" }} />

                      <div>
                        <h6 className="mb-0 fw-semibold">{ad?.seller?.username || "N/A"}</h6>

                        <small className="text-muted">
                          Member Since:{" "}
                          {ad?.seller?.createdAt
                            ? new Date(ad.seller.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                            : "Unknown"}
                        </small>
                      </div>
                    </div>

                    <hr />

                    <div className="d-flex align-items-center">
                      <IconAd stroke={1.5} size={22} className="mb-0 me-2" />
                      <p className="mb-0">Active Ads : <span className="text-success">{activeAdsCount ?? "N/A"}</span></p>
                    </div>

                    <hr />

                    {ad?.phoneNumberStatus === "show" ? (
                      <button
                        type="button"
                        className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center mb-2 gap-1"
                        onClick={() => setShowPhone((prev) => !prev)}
                        disabled={adLoading}
                      >
                        <div className="d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                          <IconPhone stroke={1.5} size={25} />
                        </div>
                        <span>{showPhone ? `+92 ${ad.phoneNumber}` : "Show Phone Number"}</span>
                      </button>
                    ) : (
                      <button type="button" className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center mb-2 gap-1" disabled>
                        <div className="d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                          <IconPhoneOff stroke={1.5} size={25} />
                        </div>
                        Phone Hidden
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ paddingBlock: "12px" }}
                      onClick={handleChatClick}
                      disabled={adLoading}
                    >
                      <IconMessageDots stroke={1.5} size={25} className="me-1" />
                      Chat with Seller
                    </button>
                  </>
                ) : (
                  <>
                    {/* Seller */}
                    <div className="d-flex align-items-center gap-3">
                      <Shimmer width="60px" height="60px" rounded="rounded-circle" className="flex-shrink-0" />
                      <div className="flex-grow-1">
                        <Shimmer width="55%" height="16px" className="mb-2" />
                        <Shimmer width="40%" height="12px" />
                      </div>
                    </div>

                    <hr />

                    {/* Active Ads */}
                    <Shimmer width="45%" height="18px" />

                    <hr />

                    {/* Buttons */}
                    <Shimmer width="100%" height="42px" rounded="rounded-2" className="mb-2" />
                    <Shimmer width="100%" height="48px" rounded="rounded-2" />
                  </>
                )}
              </div>

              <div className="col-12 d-flex align-items-center justify-content-between mb-3">
                {isLoaded ? (
                  <>
                    <p className="mb-0" style={{ marginTop: "1px" }}>Ad ID : <span className="fw-medium">{ad?.adCode || "AD-000000"}</span></p>

                    <ReportAction reportType="ad" targetId={ad._id} buttonClassName="btn btn-link p-0 text-decoration-none" buttonStyle={{ color: "#d32f2f" }} />
                  </>
                ) : (
                  <>
                    <Shimmer width="120px" height="18px" />
                    <Shimmer width="60px" height="18px" />
                  </>
                )}
              </div>

              <div className="col-12 rounded-2 overflow-hidden bg-dark" style={{ height: "clamp(20vh, 20vw, 40vh)" }}>
                <img className="w-100 h-100 object-fit-cover" src={promotion_DealSphere} alt="DealSphere Promotion"/>
              </div>
            </div>
          </div>

          {isLoaded ? (
            description && (
              <div className="col-12 mb-3">
                <p className="fw-medium mb-2" style={{ fontSize: "20px" }}>Description</p>

                <div
                  ref={descRef}
                  className="text-break text-dark-emphasis"
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.7",
                    ...(isClamped
                      ? {
                          display: "-webkit-box",
                          WebkitLineClamp: descLines,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }
                      : {}),
                  }}
                >
                  {description}
                </div>

                {isDescriptionLong && (
                  <button
                    type="button"
                    className="btn btn-link p-0 mt-2 text-decoration-none fw-medium"
                    onClick={() => setShowFullDescription((prev) => !prev)}
                  >
                    {showFullDescription ? "See Less" : "See More"}
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="col-12 mb-3">
              <p className="fw-medium mb-2" style={{ fontSize: "20px" }}>Description</p>

              <Shimmer width="100%" height="16px" className="mb-2" />
              <Shimmer width="95%" height="16px" className="mb-2" />
              <Shimmer width="90%" height="16px" className="mb-2" />
              <Shimmer width="60%" height="16px" />
            </div>
          )}
        </div>

        <div className="px-lg-2 mb-3 mb-lg-5">
          <h4 className="mb-3">Relative Ads</h4>

          {!isLoaded ? (
            <RelativeAdSkeletonRow />
          ) : !relativeAds || relativeAds.length === 0 ? (
            <p className="text-muted">No related advertisement are avaliable!</p>
          ) : (
            <Swiper
              modules={[Autoplay]}
              loop={relativeAds.length > 4}
              spaceBetween={12}
              breakpoints={{
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                992: { slidesPerView: 3 },
                1200: { slidesPerView: 4 },
                1440: { slidesPerView: 5 },
              }}
            >
              {relativeAds.map((item) => (
                <SwiperSlide key={item._id}>
                  <RelativeAdCard item={item} user={user} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        <div className="col-12 px-lg-2 mb-5">
          <p className="fw-medium mb-2" style={{ fontSize: "24px" }}>Your safety matters to us!</p>
          <p className="mb-2">• Only arrange meetings in well-lit and busy public locations like shopping malls or metro stations.</p>
          <p className="mb-2">• Avoid meeting a buyer or seller alone; bring a friend or family member with you.</p>
          <p className="mb-2">• Carefully examine and test the item before making any purchase decision.</p>
          <p className="mb-2">• Do not send or transfer money beforehand until you have properly checked the item.</p>
        </div>

        <div className="col-12 px-lg-2 mb-5">
          <div className="col-12 bg-dark rounded-3 overflow-hidden" style={{ height: "clamp(10vh, 25vw, 50vh)" }}>
            <img className="w-100 h-100 object-fit-cover" src={banner_DealSphere} alt="DealSphere Promotion"/>
          </div>
        </div>
      </div>

      <Modal title="Share Advertisement" show={showShareModal} onClose={() => setShowShareModal(false)}>
        <p className="text-muted mb-3" style={{ fontSize: "14px" }}>Copy the link below to share this advertisement</p>

        <div className="d-flex align-items-center border rounded-3 p-2 bg-light gap-2">
          <p className="mb-0 text-truncate flex-grow-1 text-muted" style={{ fontSize: "13px" }}>{window.location.href}</p>

          <button type="button" className="btn btn-primary btn-sm px-3 flex-shrink-0 rounded-2" onClick={handleCopyLink}>
            {copied ? (
              <>
                <IconCheck size={16} className="me-1" />
                Copied
              </>
            ) : (
              <>
                <IconCopy size={16} className="me-1" />
                Copy
              </>
            )}
          </button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
};

export default SingleAdvertisement;