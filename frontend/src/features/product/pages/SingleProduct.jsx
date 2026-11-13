import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IconChevronRight, IconShare3, IconCheck, IconCopy, IconEye, IconCategory, IconTag, IconShoppingCart, IconMapPin, IconMinus, IconPlus, IconBasket, IconClock, IconArrowRight, IconStarFilled } from "@tabler/icons-react";

import { useAuth } from "../../auth/hooks/useAuth";
import useProduct from "../hooks/useProduct";
import { useCartContext } from "../../cart/CartContext";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import Modal from "@/components/Model";
import { Shimmer, NoImage } from "@/components/Shimmer";

import RetaiveProductCard from "../components/RelativeProductCard";
import ContactSellerButton from "../../advertisement/components/ContactSellerButton";
import ItemChatButton from "../../chat/components/ItemChatButton";

import defaultUser from "@/assets/images/default_user.avif";

const SingleProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { productSlug } = useParams();
  const { productLoading, products, relativeProduct, handleReadSingleProduct, handleReadRelatedProducts } = useProduct();
  const { cart, cartLoading, handleAddToCart } = useCartContext();
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (productSlug) {
      const productId = productSlug.split("-").pop();
      handleReadSingleProduct(productId);
    }
  }, [productSlug]);

  useEffect(() => {
    if (products?._id) {
      handleReadRelatedProducts({
        categoryId: products.category?._id,
        currentId: products._id,
      });
    }
  }, [products?._id, products?.category?._id]);

  useEffect(() => {
    setActiveImg(0);
    setQuantity(1);
    setShowFullDescription(false);
  }, [products?._id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const product = products;
  const description = product.description || "";

  // loading state: jab tak product ka _id nahi aata
  const isLoaded = !!product._id;

  // Description ki limit height se tay hoti hai: 50vh se lambi ho to clamp + "See More"
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

  const handleViewSellerProfile = (products) => {
    if (!isLoaded) return;

    navigate({
      pathname: `${location.pathname}/profile/${products.seller?.username}-${products.seller?._id}`,
      search: location.search,
    });
  };

  const isOwnProduct =
    !!user?._id &&
    !!product.seller?._id &&
    user._id.toString() === product.seller._id.toString();

  const isInCart = cart?.items?.some((item) => (item.product?._id || item.product) === product._id);

  const handleAddToBasket = async () => {
    if (isInCart) return;
    await handleAddToCart({ productId: product._id, quantity });
  };

  const handleBuyNowClick = () => {
    if (isOwnProduct) {
      toast.error("You cannot buy your own product");
      return;
    }

    navigate(`/checkout/${product._id}`, {
      state: { product, quantity, source: "buyNow" },
    });
  };

  return (
    <div>
      <Navbar />

      <div className="container-fluid mb-5">
        <nav className="px-lg-2 mb-3">
          <div className="d-flex align-items-center flex-wrap gap-1 text-secondary" style={{ fontSize: "14px" }}>
            <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>

            {!isLoaded ? (
              <>
                <IconChevronRight size={14} />
                <Shimmer width="90px" height="14px" />
                <IconChevronRight size={14} />
                <Shimmer width="140px" height="14px" />
              </>
            ) : (
              <>
                {product.category && (
                  <>
                    <IconChevronRight size={14} />
                    <span style={{ cursor: "pointer" }} onClick={() => navigate(`/products/${product.category.slug}`)}>
                      {product.category.name}
                    </span>
                  </>
                )}

                {product.subCategory && (
                  <>
                    <IconChevronRight size={14} />
                    <span className="text-dark" style={{ cursor: "pointer" }} onClick={() => navigate(`/products/${product.category?.slug}/${product.subCategory?.slug}`)}>
                      {product.subCategory.name}
                    </span>
                  </>
                )}

                <IconChevronRight size={14} />
                <span className="text-dark text-truncate" style={{ maxWidth: "250px" }}>{product.title}</span>
              </>
            )}
          </div>
        </nav>

        <div className="row g-4 px-lg-2">
          <div className="col-12 col-lg-6 col-xl-7">
            {/* Main image: black bg, image center mein aur poori dikhe (contain) */}
            <div
              className="w-100 rounded-3 overflow-hidden mb-3 position-relative"
              style={{ height: "calc(22vh + 21.4vw)", minHeight: "350px", backgroundColor: "#000" }}
            >
              {isLoaded && product.productImages?.length > 0 ? (
                <>
                  <img
                    src={product.productImages[activeImg]?.url}
                    alt={product.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain", // poori image andar aaye, crop na ho
                      objectPosition: "center", // center mein rahe
                      display: "block",
                    }}
                  />

                  {/* Featured badge + photo counter (top right) */}
                  <div
                    className="position-absolute d-flex align-items-center gap-3"
                    style={{ top: "14px", right: "16px", zIndex: 2 }}
                  >
                    {product.featured?.isFeatured && (
                      <span
                        className="d-flex align-items-center gap-1 fw-medium rounded-pill px-3 py-1"
                        style={{ backgroundColor: "#f5a623", color: "#fff", fontSize: "14px" }}
                      >
                        <IconStarFilled size={16} color="#fff" />
                        Featured
                      </span>
                    )}
                  </div>
                </>
              ) : (
                // loading: shimmer bg + center mein "No Image Available"
                // loaded (image nahi): grey bg + center mein "No Image Available"
                <NoImage loading={!isLoaded} textSize="18px" />
              )}
            </div>

            {isLoaded && product.productImages?.length > 1 && (
              <div className="d-flex gap-2 overflow-auto pb-1 mb-4">
                {product.productImages.map((img, idx) => (
                  <div
                    key={img.public_id || idx}
                    className={`border rounded-2 overflow-hidden flex-shrink-0 ${activeImg === idx ? "border-primary border-2" : ""}`}
                    style={{ width: "70px", height: "60px", cursor: "pointer", backgroundColor: "#000" }}
                    onClick={() => setActiveImg(idx)}
                  >
                    <img src={img.url} alt={`thumb-${idx}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-12 col-lg-6 col-xl-5">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="pe-2 flex-grow-1">
                {isLoaded ? (
                  <h5 className="fw-semibold mb-1">{product.title}</h5>
                ) : (
                  <Shimmer width="75%" height="24px" />
                )}
              </div>

              <div className="d-flex gap-2 ms-3">
                {isLoaded ? (
                  <>
                    {product.contactInfo?.showPhone && <ContactSellerButton product={product} />}
                    {product.contactInfo?.chatOnly && <ItemChatButton product={product} />}

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
                  <Shimmer width="40px" height="40px" rounded="rounded-circle" />
                )}
              </div>
            </div>

            {isLoaded ? (
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <h5 className="mb-0 fw-medium text-dark">Rs {product.price?.toLocaleString()}</h5>

                {product.isPriceNegotiable && <span className="small text-success me-2">{"(Negotiable)"}</span>}

                {product.createdAt && (
                  <p className="small text-body-secondary d-flex align-items-center mb-0">
                    <IconClock size={15} className="me-1" />
                    <span>
                      {new Date(product.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).replace(/ /, " ").replace(/(\d{2}) (\w{3}) (\d{4})/, "$1 $2, $3")}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div className="d-flex align-items-center gap-3 mb-3">
                <Shimmer width="130px" height="22px" />
                <Shimmer width="110px" height="16px" />
              </div>
            )}

            {isLoaded ? (
              <div className="col-12 border border-dark-subtle rounded-3 mb-3 overflow-hidden">
                <div className="row g-0">
                  <div className="col-6 border-end border-bottom border-dark-subtle py-3 d-flex align-items-center px-3 overflow-hidden">
                    <IconEye stroke={1.5} size={24} className="me-2 me-md-3 text-primary flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="mb-0 text-body-secondary" style={{ fontSize: "14px" }}>VIEWS</p>
                      <p className="mb-0 fw-medium text-truncate" style={{ fontSize: "13px" }}>{product.views || 0}</p>
                    </div>
                  </div>

                  <div className="col-6 border-bottom border-dark-subtle py-3 d-flex align-items-center px-3 overflow-hidden">
                    <IconCategory stroke={1.5} size={22} className="me-2 me-md-3 text-primary flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="mb-0 text-body-secondary" style={{ fontSize: "14px" }}>CATEGORY</p>
                      <p className="mb-0 fw-medium text-truncate" style={{ fontSize: "13px" }}>{product.category?.name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="col-6 border-end border-bottom border-dark-subtle py-3 d-flex align-items-center px-3 overflow-hidden">
                    <IconShoppingCart stroke={1.5} size={22} className="me-2 me-md-3 text-primary flex-shrink-0" />

                    <div className="overflow-hidden">
                      <p className="mb-1 text-body-secondary" style={{ fontSize: "13px" }}>QUANTITY</p>

                      <div className="d-flex align-items-center border rounded-1 overflow-hidden">
                        <button
                          type="button"
                          className="bg-transparent border-0 d-flex align-items-center justify-content-center"
                          style={{ width: "30px", height: "30px" }}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        >
                          <IconMinus size={14} />
                        </button>

                        <div className="small d-flex align-items-center justify-content-center border-start border-end text-primary fw-medium" style={{ width: "35px", height: "30px" }}>
                          {quantity}
                        </div>

                        <button
                          type="button"
                          className="bg-transparent border-0 d-flex align-items-center justify-content-center"
                          style={{ width: "30px", height: "30px" }}
                          onClick={() => setQuantity((q) => q < product.stock ? q + 1 : q)}
                          disabled={quantity >= product.stock}
                        >
                          <IconPlus size={14} />
                        </button>
                      </div>

                      <p className="mt-1 mb-0" style={{ fontSize: "12px", color: product.stock <= 5 ? "#dc3545" : "#6c757d" }}>
                        {product.stock <= 5 ? `Only ${product.stock || 0} left!` : `${product.stock || 0} available`}
                      </p>
                    </div>
                  </div>

                  <div className="col-6 border-bottom border-dark-subtle py-3 d-flex align-items-center px-3 overflow-hidden">
                    <IconTag stroke={1.5} size={22} className="me-2 me-md-3 text-primary flex-shrink-0" />

                    <div className="overflow-hidden">
                      <p className="mb-0 text-body-secondary" style={{ fontSize: "13px" }}>SUB CATEGORY</p>
                      <p className="mb-0 fw-medium text-truncate" style={{ fontSize: "14px" }}>{product.subCategory?.name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="col-12 py-3 d-flex align-items-center px-3 overflow-hidden">
                    <IconMapPin stroke={1.5} size={22} className="me-2 me-md-3 text-primary flex-shrink-0" />

                    <div className="overflow-hidden">
                      <p className="mb-0 text-body-secondary" style={{ fontSize: "13px" }}>LOCATION</p>
                      <p className="mb-0 fw-medium text-truncate" style={{ fontSize: "14px" }}>
                        {product.city || "N/A"}
                        {product.country ? `, ${product.country}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-12 border border-dark-subtle rounded-3 mb-3 overflow-hidden">
                <div className="row g-0">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`col-6 py-3 d-flex align-items-center gap-3 px-3 ${i % 2 === 0 ? "border-end" : ""} ${i < 4 ? "border-bottom" : ""} border-dark-subtle`}
                    >
                      <Shimmer width="24px" height="24px" className="flex-shrink-0" />
                      <div className="flex-grow-1">
                        <Shimmer width="60%" height="12px" className="mb-2" />
                        <Shimmer width="80%" height="14px" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoaded ? (
              <div onClick={() => handleViewSellerProfile(products)} className="col-12 border border-dark-subtle rounded-3 p-3 mb-3" style={{ cursor: "pointer" }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="border rounded-circle overflow-hidden me-3 flex-shrink-0" style={{ width: "52px", height: "52px" }}>
                      <img
                        src={product.seller?.userImage || defaultUser}
                        alt="seller"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div>
                      <p className="fw-medium mb-0" style={{ fontSize: "1rem" }}>{product.seller?.username || "N/A"}</p>

                      <small className="text-muted">
                        Member Since:{" "}
                        {product.seller?.createdAt
                          ? new Date(product.seller.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                          : "Unknown"}
                      </small>
                    </div>
                  </div>

                  <IconArrowRight stroke={1.5} size={20} className="text-secondary" />
                </div>
              </div>
            ) : (
              <div className="col-12 border border-dark-subtle rounded-3 p-3 mb-3">
                <div className="d-flex align-items-center">
                  <Shimmer width="52px" height="52px" rounded="rounded-circle" className="me-3 flex-shrink-0" />
                  <div className="flex-grow-1">
                    <Shimmer width="50%" height="16px" className="mb-2" />
                    <Shimmer width="35%" height="12px" />
                  </div>
                </div>
              </div>
            )}

            {!isLoaded ? (
              <div className="col-12 d-flex flex-wrap align-items-center gap-2">
                <div className="col">
                  <Shimmer width="100%" height="55px" rounded="rounded-3" />
                </div>
                <div className="col">
                  <Shimmer width="100%" height="55px" rounded="rounded-3" />
                </div>
              </div>
            ) : isOwnProduct ? (
              <div className="col-12 border rounded-3 p-3 d-flex align-items-center justify-content-between gap-3 bg-body-secondary">
                <span className="text-body-secondary" style={{ fontSize: "14px" }}>
                  This is your listing. You cannot buy your own product.
                </span>
                <button
                  type="button"
                  className="btn btn-outline-primary rounded-2 flex-shrink-0"
                  onClick={() => navigate("/user/dashboard", { state: { tab: "post-tab" } })}
                >
                  Go to dashboard
                </button>
              </div>
            ) : (
              <div className="col-12 d-flex flex-wrap align-items-center gap-2">
                <div className="col">
                  <button
                    type="button"
                    className={`col-12 btn ${isInCart ? "btn-primary" : "btn-outline-primary"} rounded-3 d-flex align-items-center justify-content-center`}
                    style={{ height: "55px", cursor: isInCart ? "default" : "pointer" }}
                    disabled={cartLoading || isInCart}
                    onClick={handleAddToBasket}
                  >
                    <IconBasket stroke={1.5} size={22} className="me-2 me-md-3" color={isInCart ? "#fff" : undefined} />
                    <span>{isInCart ? "Added to Basket" : "Add to Basket"}</span>
                  </button>
                </div>

                <div className="col">
                  <button
                    type="button"
                    className="col-12 btn btn-primary rounded-3 d-flex align-items-center justify-content-center"
                    style={{ height: "55px" }}
                    onClick={() => handleBuyNowClick(product)}
                    disabled={productLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-bank me-2 me-md-3" viewBox="0 0 16 16">
                      <path d="m8 0 6.61 3h.89a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H15v7a.5.5 0 0 1 .485.38l.5 2a.498.498 0 0 1-.485.62H.5a.498.498 0 0 1-.485-.62l.5-2A.5.5 0 0 1 1 13V6H.5a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 .5 3h.89zM3.777 3h8.447L8 1zM2 6v7h1V6zm2 0v7h2.5V6zm3.5 0v7h1V6zm2 0v7H12V6zM13 6v7h1V6zm2-1V4H1v1zm-.39 9H1.39l-.25 1h13.72z" />
                    </svg>
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="col-12 mb-5">
            <p className="fw-medium mb-2" style={{ fontSize: "22px" }}>Description</p>

            {isLoaded ? (
              <>
                <div
                  ref={descRef}
                  className="text-dark-emphasis"
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
              </>
            ) : (
              <>
                <Shimmer width="100%" height="16px" className="mb-2" />
                <Shimmer width="95%" height="16px" className="mb-2" />
                <Shimmer width="90%" height="16px" className="mb-2" />
                <Shimmer width="60%" height="16px" />
              </>
            )}
          </div>

          {isLoaded && product.attributes?.length > 0 && (
            <div className="col-12 mb-4">
              <p className="fw-medium mb-2" style={{ fontSize: "22px" }}>Specifications</p>

              <div className="border border-body-subtle rounded-2 overflow-hidden">
                {product.attributes.map((attr, idx) => (
                  <div key={idx} className={`d-flex px-3 py-3 ${idx % 2 === 0 ? "bg-body-secondary" : "bg-white"}`}>
                    <span className="col col-xl-4 text-body-secondary">{attr.key}</span>
                    <span className="col col-xl-8 fw-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-lg-2 mt-5 pb-5">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="fw-semibold mb-0">Related Products</h4>
          </div>

          {!isLoaded ? (
            <RetaiveProductCard loading />
          ) : relativeProduct?.length > 0 ? (
            <RetaiveProductCard product={relativeProduct} />
          ) : (
            <div className="border rounded-3 py-5 text-center">
              <p className="text-secondary mb-0">No Related Products Available</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Share Product"
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setCopied(false);
        }}
      >
        <p className="text-muted mb-3" style={{ fontSize: "14px" }}>
          Copy the link below to share this product
        </p>

        <div className="d-flex align-items-center border rounded-3 p-2 bg-light gap-2">
          <p className="mb-0 text-truncate flex-grow-1 text-muted" style={{ fontSize: "13px" }}>
            {window.location.href}
          </p>

          <button
            type="button"
            className="btn btn-primary btn-sm px-3 flex-shrink-0 rounded-2"
            onClick={handleCopyLink}
          >
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

export default SingleProduct;