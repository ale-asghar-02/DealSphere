import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { IconBuildingBank, IconMapPin, IconBasket } from '@tabler/icons-react';

import { useCartContext } from '../../cart/CartContext';
import { Shimmer, NoImage } from '@/components/Shimmer';

// Loading card (same layout, same sizes)
const RelativeProductCardSkeleton = () => (
  <div className="card p-2 h-100">
    {/* Image: shimmer bg + center mein chhota "No Image Available" */}
    <div className="border rounded-2 overflow-hidden mb-2" style={{ width: '100%', height: '24vh' }}>
      <NoImage loading />
    </div>

    {/* Title */}
    <Shimmer width="80%" height="22px" className="mb-2" />

    {/* Price */}
    <Shimmer width="55%" height="16px" className="mb-2" />

    {/* Location */}
    <Shimmer width="70%" height="16px" className="mb-3" />

    {/* Add to cart row */}
    <div className="d-flex align-items-center justify-content-between mt-auto">
      <Shimmer width="150px" height="16px" />
      <Shimmer width="36px" height="36px" rounded="rounded-circle" className="flex-shrink-0" />
    </div>
  </div>
);

// Swiper ke breakpoints jitne cards ek row mein: 1 / 2 / 3 / 5
const skeletonColClass = (index) => {
  const base = 'col-12 col-md-6 col-lg-4 col-xl';
  if (index === 0) return base;
  if (index === 1) return `${base} d-none d-md-block`;
  if (index === 2) return `${base} d-none d-lg-block`;
  return `${base} d-none d-xl-block`;
};

// loading = true -> skeleton cards (parent se pass karo)
const RelativeProductCard = ({ product = [], loading = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, cartLoading, handleAddToCart } = useCartContext();

  if (loading) {
    return (
      <div className="row g-3 pb-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={skeletonColClass(i)}>
            <RelativeProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (!product.length) return null;

  // check karte hain ke ye product pehle se cart mein hai ya nahi
  const isInCart = (productId) =>
    cart?.items?.some(
      (item) => (item.product?._id || item.product) === productId
    );

  const handleCartClick = async (e, productId) => {
    e.stopPropagation(); // taake product page par navigate na ho jaye

    if (isInCart(productId)) return; // pehle se add ha to kuch na karo

    await handleAddToCart({ productId, quantity: 1 });
  };

  const handleViewProduct = (product) => {
    const categorySlug = product.category?.slug;
    const subSlug = product.subCategory?.slug || 'all';

    navigate({
      pathname: `/product/${categorySlug}/${subSlug}/${encodeURIComponent(
        product.title
      )}-${product._id}`,
      search: location.search,
    });
  };

  return (
    <Swiper
      modules={[Autoplay]}
      autoplay={{ delay: 2500, disableOnInteraction: false }}
      loop={product.length > 4}
      pagination={{ clickable: true }}
      spaceBetween={12}
      breakpoints={{
        0: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        992: { slidesPerView: 3 },
        1200: { slidesPerView: 5 },
      }}
      style={{ paddingBottom: '35px' }}
    >
      {product.map((item) => {
        const inCart = isInCart(item._id);

        return (
          <SwiperSlide key={item._id}>
            <div
              className="card p-2 h-100 position-relative"
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewProduct(item)}
            >
              <div
                className="border rounded-2 overflow-hidden mb-2"
                style={{ width: '100%', height: '24vh' }}
              >
                {item.productImages?.[0]?.url ? (
                  <img
                    className="w-100 h-100 object-fit-cover"
                    src={item.productImages[0].url}
                    alt={item.title}
                  />
                ) : (
                  // image na ho to grey bg + center mein chhota "No Image Available"
                  <NoImage />
                )}
              </div>

              <h5 className="col-12 text-truncate mb-1">{item.title}</h5>
              <p className="mb-1 text-body-secondary d-flex flex-wrap align-items-center gap-1">
                <IconBuildingBank size={16} />
                <span>Price :</span>
                <span className="text-dark">
                  Rs {item.price?.toLocaleString()}
                </span>
                {item.isPriceNegotiable && (
                  <span className="text-success" style={{ fontSize: '12px' }}>
                    (Negotiable)
                  </span>
                )}
              </p>

              <p className="text-truncate text-body-secondary d-flex align-items-center gap-1 mb-2">
                <IconMapPin size={16} className="flex-shrink-0" />
                <span>Location :</span>
                <span className="text-truncate">
                  {item.city}
                  {item.country ? `, ${item.country}` : ''}
                </span>
              </p>

              <div className="col-12 d-flex align-items-center justify-content-between mt-auto">
                <p className="mb-0">Add this item to your cart</p>
                <button
                  className={`btn d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 p-0 ${
                    inCart ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  style={{
                    width: '36px',
                    height: '36px',
                    cursor: inCart ? 'default' : 'pointer',
                  }}
                  disabled={cartLoading || inCart}
                  onClick={(e) => handleCartClick(e, item._id)}
                >
                  <IconBasket
                    stroke={1.5}
                    size={22}
                    color={inCart ? '#fff' : undefined}
                  />
                </button>
              </div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default RelativeProductCard;