import React, { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { IconBasket, IconMapPin, IconCrown } from '@tabler/icons-react'

import { useAuth } from '../../auth/hooks/useAuth'
import { useCartContext } from '../../cart/CartContext'
import { Shimmer, NoImage } from '@/components/Shimmer'

// product = {} pass karo to loading (shimmer) state dikhegi
// pageMarker = us page ka number jis ka ye pehla card ha (infinite scroll ke URL sync ke liye)
const ProductCard = ({ product = {}, pageMarker }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const swiperRef = useRef(null)

  // loading state: jab tak product ka _id nahi aata
  const isLoaded = !!product._id

  const { user } = useAuth()
  // seller populated object bhi ho sakta hai aur sirf id string bhi
  const sellerId = product.seller?._id || product.seller
  const isOwnProduct =
    !!user?._id && !!sellerId && user._id.toString() === sellerId.toString()

  const { cart, cartLoading, handleAddToCart } = useCartContext()

  // check karte hain ke ye product pehle se cart mein hai ya nahi
  const isInCart = isLoaded && cart?.items?.some(
    (item) => (item.product?._id || item.product) === product._id
  )

  const handleCartClick = async (e) => {
    e.stopPropagation() // taake product page par navigate na ho jaye

    if (isInCart) return // pehle se add ha to kuch na karo

    await handleAddToCart({ productId: product._id, quantity: 1 })
  }

  const timeAgo = (date) => {
    if (!date) return ''
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' minutes ago'

    return Math.floor(seconds) + ' seconds ago'
  }

  const handleMouseEnter = () => {
    if (swiperRef.current && product.productImages?.length > 1) {
      swiperRef.current.params.autoplay.delay = 500
      swiperRef.current.autoplay.start()
    }
  }

  const handleMouseLeave = () => {
    if (swiperRef.current && product.productImages?.length > 1) {
      swiperRef.current.autoplay.stop()
      swiperRef.current.slideTo(0)
    }
  }

  const isFeatured = product.featured?.isFeatured

  const handleViewProduct = () => {
    if (!isLoaded) return // loading ke waqt click par kuch na ho

    const categorySlug = product.category?.slug
    const subSlug = product.subCategory?.slug || 'all'

    navigate({
      pathname: `/product/${categorySlug}/${subSlug}/${encodeURIComponent(product.title)}-${product._id}`,
      search: location.search,
    })
  }

  return (
    <div className="col-12 col-sm-6 col-xl-4 col-xxl-3"
      data-page-marker={pageMarker}
      style={{ cursor: isLoaded ? 'pointer' : 'default', height: 'fit-content' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleViewProduct}>

      <div className={`card p-2 position-relative d-flex flex-column overflow-hidden ${isFeatured ? 'border-warning' : ''}`}>

        {/* Featured badge: hamesha "Featured" likha aaye (plan ka naam nahi) */}
        {isLoaded && isFeatured && (
          <div
            className="position-absolute top-0 start-0 z-2 m-2 px-2 py-1 rounded-pill d-flex align-items-center gap-1"
            style={{ backgroundColor: '#FFC107', fontSize: '11px', fontWeight: 600, color: '#212529' }}
          >
            <IconCrown size={12} color="#212529" />
            <span>Featured</span>
          </div>
        )}

        {/* Image / Swiper */}
        <div className='border rounded-2 overflow-hidden mb-2 position-relative'
          style={{ width: '100%', height: '24vh', flexShrink: 0 }}>

          {isLoaded && product.productImages?.length > 0 ? (
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              modules={[Pagination, Autoplay]}
              autoplay={{ delay: 500, disableOnInteraction: false, enabled: false }}
              loop={product.productImages.length > 1}
              pagination={{ dynamicBullets: true, clickable: true }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', height: '100%' }}
            >
              {product.productImages.map((img, idx) => (
                <SwiperSlide key={img.public_id || idx}>
                  <img
                    src={img.url}
                    alt={`product-${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            // loading: shimmer bg + center mein "No Image Available"
            // loaded (image nahi): grey bg + center mein "No Image Available"
            <NoImage loading={!isLoaded} className="rounded-2" />
          )}

        </div>

        {isLoaded ? (
          <>
            <h5 className='col-12 text-truncate mb-1' style={{ minHeight: '24px', fontSize: '17px' }}>{product.title}</h5>

            <p className='mb-1 text-body-secondary' style={{ minHeight: '22px' }}>
              Price :
              <span className='text-dark'> Rs {product.price?.toLocaleString()}</span>
              {product.isPriceNegotiable && (
                <span className="text-success ms-1" style={{ fontSize: '12px' }}>{'(Negotiable)'}</span>
              )}
            </p>

            {/* Location */}
            <p className='mb-1 text-body-secondary d-flex align-items-center gap-1' style={{ fontSize: '13px', minHeight: '20px' }}>
              <IconMapPin size={15} />
              <span className='text-truncate'>{product.city}{product.country ? `, ${product.country}` : ''}</span>
            </p>

            <div className='d-flex align-items-center justify-content-between' style={{ minHeight: '24px' }}>
              <p className='small text-body-secondary mb-0'>
                <span className='text-dark'>{timeAgo(product.createdAt)}</span>
              </p>

              {/* Views */}
              <span className='border border-success rounded-1 d-flex align-items-center gap-1 text-success px-2' style={{ fontSize: '12px' }}>
                <span>views : </span>
                {product.views ?? 0}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Title */}
            <Shimmer width="85%" height="20px" className="mb-2 mt-1" />

            {/* Price */}
            <Shimmer width="55%" height="16px" className="mb-2" />

            {/* Location */}
            <Shimmer width="70%" height="14px" className="mb-2" />

            {/* Time + Views */}
            <div className="d-flex align-items-center justify-content-between">
              <Shimmer width="80px" height="14px" />
              <Shimmer width="70px" height="22px" />
            </div>
          </>
        )}

        {/* Cart button: loading ke waqt shimmer circle */}
        {!isOwnProduct && (
          isLoaded ? (
            <div className="bg-white rounded-circle position-absolute top-0 end-0 z-2 m-1">
              <button
                className={`btn d-flex align-items-center justify-content-center rounded-circle p-0 ${isInCart ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ width: "40px", height: "40px", cursor: isInCart ? 'default' : 'pointer' }}
                disabled={cartLoading || isInCart}
                onClick={handleCartClick}>
                <IconBasket stroke={1.5} size={22} color={isInCart ? '#fff' : undefined} />
              </button>
            </div>
          ) : (
            <Shimmer
              width="40px"
              height="40px"
              rounded="rounded-circle"
              className="position-absolute top-0 end-0 z-2 m-1"
            />
          )
        )}

      </div>

    </div>
  )
}

export default ProductCard