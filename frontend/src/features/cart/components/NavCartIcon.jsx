import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartContext } from "../CartContext";
import { IconX } from '@tabler/icons-react';
import { Shimmer, NoImage } from "@/components/Shimmer";
import "../cart.scss";

const SIDE_GAP = 12; // small screen par dono taraf spacing (px)

const NavCartIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileStyle, setMobileStyle] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { cart, cartLoading, handleRemoveFromCart } = useCartContext();

  const items = cart?.items || [];
  const itemsCount = items.length;
  const totalPrice = cart?.totalPrice || 0;

  // dropdown ke bahar click karne par close ho jaye
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 425px ya chhoti screen: dropdown screen ke barabar (dono taraf gap ke saath),
  // aur cart icon ke bilkul neeche
  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (window.innerWidth <= 425 && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setMobileStyle({
          left: -rect.left + SIDE_GAP,
          right: "auto",
          width: document.documentElement.clientWidth - SIDE_GAP * 2,
        });
      } else {
        setMobileStyle(null);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen]);

  const handleNavigateToProduct = (product) => {
    const categorySlug = product.category?.slug;
    const subSlug = product.subCategory?.slug || "all";

    setIsOpen(false);
    navigate({
      pathname: `/product/${categorySlug}/${subSlug}/${encodeURIComponent(product.title)}-${product._id}`,
      search: location.search,
    });
  };

  const handleRemoveItem = async (e, productId) => {
    e.stopPropagation();
    await handleRemoveFromCart({ productId });
  };

  const handleViewCart = () => {
    setIsOpen(false);
    navigate("/cart");
  };

  return (
    <div className="position-relative" ref={dropdownRef}>

      {/* Cart Icon */}
      <div
        className="position-relative"
        style={{ cursor: "pointer" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          fill="currentColor"
          className="text-dark bi bi-cart"
          viewBox="0 0 16 16"
        >
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
        </svg>

        {itemsCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle d-flex align-items-center justify-content-center rounded-pill text-white bg-primary"
            style={{ width: "20px", height: "20px", fontSize: "10px", marginRight: "1px" }}
          >
            {itemsCount}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="cart-dropdown bg-white border rounded-2"
          style={mobileStyle || undefined}
        >
          <div className="p-3 border-bottom">
            <p className="mb-0 fw-medium">Cart ({itemsCount} items)</p>
          </div>

          {/* Empty state */}
          {!cartLoading && itemsCount === 0 && (
            <div className="p-4 text-center text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-cart-x mb-2" viewBox="0 0 16 16">
                <path d="M7.354 5.646a.5.5 0 1 0-.708.708L7.793 7.5 6.646 8.646a.5.5 0 1 0 .708.708L8.5 8.207l1.146 1.147a.5.5 0 0 0 .708-.708L9.207 7.5l1.147-1.146a.5.5 0 0 0-.708-.708L8.5 6.793z"/>
                <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zm3.915 10L3.102 4h10.796l-1.313 7zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0m7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
              </svg>
              <p className="mb-0">Your cart is empty</p>
            </div>
          )}

          {/* Loading state: skeleton rows */}
          {cartLoading && (
            <div>
              {[0].map((i) => (
                <div key={i} className="d-flex align-items-center gap-2 px-3 py-2 border-bottom">
                  <div className="border rounded-1 overflow-hidden flex-shrink-0"
                    style={{ width: "70px", height: "48px" }}>
                    <NoImage loading showIcon showText={false} iconSize={18} />
                  </div>

                  <div className="flex-grow-1">
                    <Shimmer width="80%" height="13px" className="mb-2" />
                    <Shimmer width="50%" height="12px" />
                  </div>

                  <Shimmer width="28px" height="28px" rounded="rounded-circle" className="flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Items list */}
          {!cartLoading && itemsCount > 0 && (
            <div style={{ maxHeight: "260px", overflowY: "auto" }}>
              {items.map((item) => (
                <div
                  key={item._id}
                  className="d-flex align-items-center gap-2 px-3 py-2 border-bottom"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleNavigateToProduct(item.product)}
                >
                  <div className="border rounded-1 overflow-hidden flex-shrink-0"
                    style={{ width: "70px", height: "48px" }}>
                    {item.product?.productImages?.[0]?.url ? (
                      <img
                        src={item.product.productImages[0].url}
                        alt={item.product?.title || "Product"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <NoImage showIcon showText={false} iconSize={18} />
                    )}
                  </div>

                  <div className="flex-grow-1 overflow-hidden">
                    <p className="mb-0 text-truncate fw-medium" style={{ fontSize: "13px" }}>
                      {item.product?.title}
                    </p>
                    <p className="mb-0 text-primary" style={{ fontSize: "12px" }}>
                      Rs {item.price} × {item.quantity}
                    </p>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "28px", height: "28px", padding: 0 }}
                    onClick={(e) => handleRemoveItem(e, item.product?._id)}>
                    <IconX stroke={2} size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total + Go to cart */}
          {!cartLoading && itemsCount > 0 && (
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted" style={{ fontSize: "13px" }}>Total</span>
                <span className="fw-semibold">Rs {totalPrice}</span>
              </div>
              <button className="btn btn-primary w-100 rounded-2" style={{ paddingBlock: "8px" }} onClick={handleViewCart}>
                View Cart
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavCartIcon;