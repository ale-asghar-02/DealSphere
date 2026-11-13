import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

import useProduct from '../../product/hooks/useProduct'
import { Shimmer, NoImage } from '@/components/Shimmer'
import { IconArrowUpRight, IconCoin, IconCrown } from '@tabler/icons-react'

// image shimmer ke upar wale shimmers thode gehre dikhein (warna background mein ghul jayenge)
const overlayShimmer = { filter: 'brightness(0.9)' }

// Loading card: poore card par shimmer bg + center mein "No Image Available",
// upar price / neeche title, description aur button par shimmer
const ProductCardSkeleton = () => (
  <div
    className="col-12 card rounded-4 overflow-hidden position-relative"
    style={{ height: '420px' }}
  >
    <NoImage loading textSize="16px" />

    <div className="col-12 d-flex flex-column justify-content-between h-100 position-absolute top-0 start-0 px-3 py-3">
      {/* Price */}
      <div className="d-flex justify-content-end">
        <Shimmer width="80px" height="28px" rounded="rounded-pill" style={overlayShimmer} />
      </div>

      <div className="col-12">
        {/* Title + description */}
        <div className="mb-3">
          <Shimmer width="85%" height="20px" className="mb-2" style={overlayShimmer} />
          <Shimmer width="60%" height="20px" className="mb-3" style={overlayShimmer} />
          <Shimmer width="100%" height="12px" className="mb-2" style={overlayShimmer} />
          <Shimmer width="90%" height="12px" className="mb-2" style={overlayShimmer} />
          <Shimmer width="50%" height="12px" style={overlayShimmer} />
        </div>

        {/* View Product button */}
        <Shimmer width="100%" height="50px" rounded="rounded-pill" style={overlayShimmer} />
      </div>
    </div>
  </div>
)

// Swiper ke breakpoints jitne cards ek row mein: 1 / 2 / 3 / 4 / 5
const skeletonColClass = (index) => {
  const base = 'col-12 col-sm-6 col-md-4 col-lg-3 col-xl'
  if (index === 0) return base
  if (index === 1) return `${base} d-none d-sm-block`
  if (index === 2) return `${base} d-none d-md-block`
  if (index === 3) return `${base} d-none d-lg-block`
  return `${base} d-none d-xl-block`
}

/**
 * "Recommended For You" section: shows all active products in a responsive swiper.
 * Uses real `product` model fields: productImages, price, title, description.
 */
const RecommendedProducts = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { products, productLoading, handleReadAllProduct } = useProduct()

  // pehli fetch complete hone tak true (taake "No products" ek second ke liye flash na ho)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      await handleReadAllProduct({ page: 1, limit: 16 })
      setInitialLoading(false)
    }
    loadProducts()
  }, [])

  // products nahi aaye aur fetch chal rahi hai => skeleton
  const isLoading = !products?.length && (initialLoading || productLoading)

  const handleViewProduct = (product) => {
    const categorySlug = product.category?.slug
    const subSlug = product.subCategory?.slug || 'all'

    navigate({
      pathname: `/product/${categorySlug}/${subSlug}/${encodeURIComponent(product.title)}-${product._id}`,
      search: location.search,
    })
  }

  return (
    <div className="col-12 px-3 px-lg-4 recommended-product-card pb-5" style={{ backgroundColor: '#F4F4F4' }}>
      <div className="col-12 d-flex flex-wrap align-items-center py-lg-5 mb-3 mb-lg-0">
        <div className="col-12 col-lg-8"><h1>Recommended For You</h1></div>
        <div className="col-12 col-lg-4 text-body-secondary">
          <p className="mb-0">Based on your interests and latest trends, discover products tailored for you.</p>
        </div>
      </div>

      {isLoading && (
        <div className="row g-3 g-lg-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={skeletonColClass(i)}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !products?.length && (
        <p className="text-body-secondary mb-0">No products to show right now.</p>
      )}

      {!isLoading && products?.length > 0 && (
        <Swiper
          className="recommended-swiper"
          modules={[Autoplay]}
          loop={products.length > 5}
          grabCursor={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true, // hover par autoplay ruk jayega, mouse hatne par dobara chalega
          }}
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 12 },
            576: { slidesPerView: 2, spaceBetween: 12 },
            768: { slidesPerView: 3, spaceBetween: 14 },
            992: { slidesPerView: 4, spaceBetween: 16 },
            1200: { slidesPerView: 5, spaceBetween: 16 },
          }}
        >
          {products.map((product) => {
            const isFeatured = !!product.featured?.isFeatured

            return (
              <SwiperSlide key={product._id}>
                <div className="col-12 product-card-item">
                  <div
                    // featured ho to warning border
                    className={`col-12 card rounded-4 overflow-hidden position-relative ${isFeatured ? 'border-warning' : ''}`}
                    style={{ height: '420px', cursor: 'pointer' }}
                    onClick={() => handleViewProduct(product)}
                  >
                    {product.productImages?.[0]?.url ? (
                      <img
                        className="h-100 w-100"
                        src={product.productImages[0].url}
                        alt={product.title}
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                    ) : (
                      // image na ho to grey bg + center mein "No Image Available"
                      <div className="h-100 w-100">
                        <NoImage textSize="16px" />
                      </div>
                    )}
                    <div
                      className="col-12 d-flex flex-column justify-content-between h-100 position-absolute bottom-0 px-3 py-3"
                      style={{ backgroundColor: '#00000025' }}
                    >
                      {/* Price + Featured badge: ek row mein, jagah kam ho to wrap ho jayen */}
                      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-2">
                        {isFeatured && (
                          <div
                            className="bg-warning text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 rounded-pill px-2 mb-0"
                            style={{ width: 'fit-content', paddingBlock: '4px', fontSize: '13px' }}
                          >
                            <IconCrown size={14} />
                            <span>Featured</span>
                          </div>
                        )}

                        {/* ms-auto: featured na ho tab bhi price right par hi rahe */}
                        <div
                          className="text-dark bg-white d-flex align-items-center justify-content-center gap-2 rounded-pill px-2 pe-3 mb-0 ms-auto"
                          style={{ width: 'fit-content', paddingBlock: '4px' }}
                        >
                          <IconCoin size={17} className="text-success" />
                          <span className="small">{Number(product.price || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="text-white mb-3">
                          <p
                            className="fs-5 fw-medium mb-1"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.title}
                          </p>
                          <small
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.description}
                          </small>
                        </div>
                        <div className="bg-white rounded-pill d-flex align-items-center justify-content-between px-3" style={{ height: '50px' }}>
                          <p className="mb-0 btn-text">View Product</p>
                          <IconArrowUpRight size={18} className="product-arrow-icon" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      )}
    </div>
  )
}

export default RecommendedProducts