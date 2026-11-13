import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { IconCalendar, IconMapPin, IconMapPinOff, IconSpeakerphone, IconPackage, IconRosetteDiscountCheck, IconEye, IconCrown, IconPhone, IconHome, IconUserCircle, IconTag } from "@tabler/icons-react";

import useUser from "@/hooks/useUser";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import { Shimmer, NoImage } from "@/components/Shimmer";
import { timeAgo } from "@/utils/timeAgo";

// ListingCard ka loading skeleton (same layout, same sizes)
const ListingCardSkeleton = () => (
  <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
    <div className="card border rounded-3 h-100 overflow-hidden">
      <div style={{ height: "210px" }}>
        {/* shimmer bg + center mein chhota "No Image Available" */}
        <NoImage loading />
      </div>

      <div className="card-body px-3 py-2">
        {/* Title */}
        <Shimmer width="90%" height="16px" className="mb-2 mt-1" />
        <Shimmer width="60%" height="16px" className="mb-3" />

        {/* Price */}
        <Shimmer width="45%" height="18px" className="mb-3" />

        {/* City + Views */}
        <div className="d-flex align-items-center justify-content-between">
          <Shimmer width="80px" height="13px" />
          <Shimmer width="40px" height="13px" />
        </div>

        {/* Time + Code */}
        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
          <Shimmer width="60px" height="12px" />
          <Shimmer width="80px" height="12px" />
        </div>
      </div>
    </div>
  </div>
);

const ListingCard = ({ item, image, onClick, isAd }) => (
  <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
    <div
      className="card border rounded-3 h-100 overflow-hidden"
      style={{ cursor: "pointer", transition: "box-shadow .15s ease, border-color .15s ease" }}
      onClick={onClick}>
      <div className="position-relative" style={{ height: "210px" }}>
        {image ? (
          <img src={image} alt={item.title} className="w-100 h-100" style={{ objectFit: "cover" }} />
        ) : (
          // grey bg + center mein chhota "No Image Available"
          <NoImage />
        )}
        {(isAd ? item.isFeatured : item.featured?.isFeatured) && (
          <span className="position-absolute top-0 start-0 badge d-flex align-items-center gap-1 bg-warning text-dark fw-semibold rounded-pill m-2">
            <IconCrown size={12} />
            Featured
          </span>
        )}
      </div>

      <div className="card-body px-3 py-2">
        <h6
          className="mb-1 fw-semibold text-dark"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "38px" }}
        >
          {item.title}
        </h6>

        <div className="d-flex align-items-baseline gap-2 mb-2">
          <span className="fw-bold">Rs {item.price?.toLocaleString()}</span>
          {item.isPriceNegotiable && <span className="text-success" style={{ fontSize: "11px" }}>{"(Negotiable)"}</span>}
        </div>

        <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: "12px" }}>
          <span className="d-flex align-items-center text-truncate" style={{ maxWidth: "60%" }}>
            <IconMapPin size={13} className="me-1 flex-shrink-0" />
            {item.city || "N/A"}
          </span>
          <div className="d-flex align-items-center gap-2">
            {typeof item.views === "number" && (
              <span className="d-flex align-items-center">
                <IconEye size={13} className="me-1" /> {item.views}
              </span>
            )}
            {typeof item.stock === "number" && <span>{item.stock} in stock</span>}
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top" style={{ borderColor: "#eee !important" }}>
          <small className="text-muted">{timeAgo(item.createdAt)}</small>
          <span className="text-muted" style={{ fontSize: "11px", letterSpacing: ".02em" }}>
            {isAd ? item.adCode || "AD-0000000" : item.productCode}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, label }) => (
  <div className="text-center py-5 my-3 text-muted border" style={{ borderRadius: "10px", borderColor: "#e5e7eb", background: "#fafafa" }}>
    <Icon size={40} className="mb-2 opacity-50" />
    <p className="mb-0">{label}</p>
  </div>
);

const MetaItem = ({ icon: Icon, children }) => (
  <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: "13.5px" }}>
    <Icon size={15} style={{ flexShrink: 0 }} />
    {children}
  </span>
);

// Seller avatar box (84px): image ho to image, warna sirf icon
// loading = true -> shimmer bg + icon, loading = false -> grey bg + icon
const AvatarBox = ({ src, alt, loading = false }) => (
  <div
    className="border flex-shrink-0 overflow-hidden"
    style={{ width: "84px", height: "84px", borderRadius: "10px", borderColor: "#e5e7eb" }}
  >
    {!loading && src ? (
      <img src={src} alt={alt} className="w-100 h-100" style={{ objectFit: "cover" }} />
    ) : (
      <NoImage loading={loading} showIcon showText={false} iconSize={24} />
    )}
  </div>
);

const getCountryName = (code) => {
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
};

const SellerProfile = () => {
  const { usernameSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, handleGetSellerProfile } = useUser();
  const [activeTab, setActiveTab] = useState("ads");

  useEffect(() => {
    handleGetSellerProfile(usernameSlug);
  }, [usernameSlug]);

  const { user, ads = [], products = [] } = userProfile || {};

  // user._id nahi hai => loading state (shimmer)
  // Agar useUser mein loading flag ho (jaise profileLoading) to: profileLoading || !user?._id
  const isLoading = !user?._id;

  const goToAd = (ad) => {
    const categorySlug = ad.category?.slug;
    const subSlug = ad.subCategory?.slug || "all";
    navigate({
      pathname: `/advertisement/${categorySlug}/${subSlug}/${encodeURIComponent(ad.title)}-${ad._id}`,
      search: location.search,
    });
  };

  const goToProduct = (item) => {
    const categorySlug = item.category?.slug;
    const subSlug = item.subCategory?.slug || "all";
    navigate({
      pathname: `/product/${categorySlug}/${subSlug}/${encodeURIComponent(item.title)}-${item._id}`,
      search: location.search,
    });
  };

  return (
    <div>
      <Navbar />

      <div className="container mb-5">
        {/* ── Profile Header ── */}
        <div className="border rounded-3 overflow-hidden mt-3 mb-4">
          <div className="p-4">
            <div className="d-flex flex-column flex-md-row align-items-start gap-3">
              <div className="d-flex flex-wrap flex-grow-1 gap-3 w-100">
                {isLoading ? (
                  <>
                    <AvatarBox loading />
                    <div className="flex-grow-1" style={{ minWidth: "200px" }}>
                      {/* Username + badge */}
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Shimmer width="160px" height="26px" />
                        <Shimmer width="60px" height="22px" />
                      </div>
                      {/* Meta items */}
                      <div className="d-flex flex-wrap column-gap-3 row-gap-2">
                        <Shimmer width="170px" height="16px" />
                        <Shimmer width="130px" height="16px" />
                        <Shimmer width="110px" height="16px" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <AvatarBox src={user?.userImage} alt={user?.username} />
                    <div className="flex-grow-1" style={{ minWidth: "200px" }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h4 className="fw-bold mb-0 text-dark">{user?.username}</h4>
                        {user?.isAccountVerified && (
                          <span className="d-flex align-items-center gap-1 text-dark" style={{ fontSize: "12px" }}>
                            <IconRosetteDiscountCheck size={17} style={{ flexShrink: 0, color: "#1a7f37" }} />
                          </span>
                        )}
                        {user?.accountType && (
                          <span className="badge text-secondary border rounded-1 fw-medium" style={{ background: "#f6f7f8", fontSize: "12px" }}>
                            {user?.accountType}
                          </span>
                        )}
                      </div>

                      <div className="d-flex flex-wrap column-gap-3 row-gap-1 mt-2">
                        <div className="d-flex flex-wrap gap-3">
                          <MetaItem icon={IconCalendar}>
                            Member since{" "}
                            {user?.createdAt
                              ? new Date(user?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                              : "N/A"}
                          </MetaItem>
                          {user?.city || user?.country ? (
                            <MetaItem icon={IconMapPin}>
                              {[user?.city, getCountryName(user?.country)].filter(Boolean).join(", ")}
                            </MetaItem>
                          ) : (
                            <span className="fst-italic d-flex align-items-center text-muted" style={{ fontSize: "13.5px" }}>
                              <IconMapPinOff size={15} style={{ flexShrink: 0 }} className="me-1" />
                              Location not set
                            </span>
                          )}
                        </div>
                        {user?.address && <MetaItem icon={IconHome}>{user?.address}</MetaItem>}
                        {user?.gender && <MetaItem icon={IconUserCircle}>{user?.gender}</MetaItem>}
                        {user?.phoneNumber && <MetaItem icon={IconPhone}>+92 {user?.phoneNumber}</MetaItem>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="d-flex gap-4 ps-md-3 pt-3 pt-md-0 mt-3 mt-md-0 ms-md-auto w-100 w-md-auto justify-content-end">
                {isLoading ? (
                  <>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <Shimmer width="32px" height="24px" />
                      <Shimmer width="28px" height="12px" />
                    </div>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <Shimmer width="32px" height="24px" />
                      <Shimmer width="52px" height="12px" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="fw-bold" style={{ fontSize: "20px", color: "#111827" }}>{ads.length}</div>
                      <div className="text-muted" style={{ fontSize: "11.5px" }}>Ads</div>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold" style={{ fontSize: "20px", color: "#111827" }}>{products.length}</div>
                      <div className="text-muted" style={{ fontSize: "11.5px" }}>Products</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #eee" }}>
                <Shimmer width="100%" height="14px" className="mb-2" />
                <Shimmer width="70%" height="14px" />
              </div>
            ) : (
              user?.aboutMe && (
                <p
                  className="text-secondary mt-3 mb-0 pt-3"
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word", fontSize: "14px", borderTop: "1px solid #eee" }}
                >
                  {user?.aboutMe}
                </p>
              )
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="d-flex align-items-center border-bottom gap-4 mb-4">
          {[
            { key: "ads", label: "Ads", count: ads.length, icon: IconSpeakerphone },
            { key: "products", label: "Products", count: products.length, icon: IconTag },
          ].map((tab) => (
            <button
              key={tab.key}
              className="btn rounded-0 px-1 pb-2 d-flex align-items-center gap-2"
              style={{
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #111827" : "2px solid transparent",
                color: activeTab === tab.key ? "#111827" : "#8a8f98",
                fontWeight: activeTab === tab.key ? 600 : 500,
                fontSize: "14.5px",
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={16} />
              {tab.label}
              {isLoading ? (
                <Shimmer width="22px" height="18px" />
              ) : (
                <span
                  style={{
                    fontSize: "11px",
                    color: activeTab === tab.key ? "#fff" : "#6b7280",
                    background: activeTab === tab.key ? "#111827" : "#eceef0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ minHeight: "60vh" }}>
          {isLoading ? (
            // loading: 4 skeleton cards (ek row)
            <div className="row g-3 pb-5">
              {[...Array(4)].map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {activeTab === "ads" &&
                (ads.length === 0 ? (
                  <EmptyState icon={IconSpeakerphone} label="No ads posted yet." />
                ) : (
                  <div className="row g-3 pb-5">
                    {ads.map((ad) => (
                      <ListingCard key={ad._id} item={ad} image={ad.adsImages?.[0]?.url} onClick={() => goToAd(ad)} isAd />
                    ))}
                  </div>
                ))}

              {activeTab === "products" &&
                (products.length === 0 ? (
                  <EmptyState icon={IconPackage} label="No products posted yet." />
                ) : (
                  <div className="row g-3 pb-5">
                    {products.map((item) => (
                      <ListingCard key={item._id} item={item} image={item.productImages?.[0]?.url} onClick={() => goToProduct(item)} />
                    ))}
                  </div>
                ))}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SellerProfile;