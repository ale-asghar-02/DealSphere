import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

import useAdvertisement from '../../advertisement/hooks/useAdvertisement'
import { useAuth } from '../../auth/hooks/useAuth'
import { NoImage } from '@/components/Shimmer'

import { IconMessageCircle2, IconBox, IconMapPin, IconMap2, IconCompass, IconBuildingBank } from '@tabler/icons-react'

// Disabled inputs keep their normal white background instead of Bootstrap's grey disabled style
const disabledInputStyle = {
  paddingLeft: '40px',
  backgroundColor: '#fff',
  opacity: 1,
  color: '#212529',
}

/**
 * Top home-page banner: shows ads filtered by a single category (default "mobiles").
 * Same original UI/content, now wired to real ad-model data.
 */
const AdsBanner = ({ categorySlug = 'mobiles' }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { ads, adLoading, handleGetAllAdsWithCategorySlug } = useAdvertisement()

  useEffect(() => {
    handleGetAllAdsWithCategorySlug({ categorySlug, limit: 16 })
  }, [categorySlug])

  const handleChatClick = (e, ad) => {
    e.stopPropagation()
    if (!ad) return

    if (!user) { toast.error('Please login to continue.')
      return
    }

    const sellerId = ad.seller?._id

    if (user._id?.toString() === sellerId?.toString()) {
      toast.error('You cannot chat on your own advertisement.')
      return
    }

    navigate(`/chat/${ad._id}?seller=${sellerId}&type=advertisement`)
  }

  const handleViewAd = (e, ad) => {
    e.stopPropagation()
    const catSlug = ad.category?.slug
    const subSlug = ad.subCategory?.slug || 'all'

    navigate({
      pathname: `/advertisement/${catSlug}/${subSlug}/${encodeURIComponent(ad.title)}-${ad._id}`,
      search: location.search,
    })
  }

  // loading: poore card par shimmer bg + center mein "No Image Available"
  if (adLoading) return (
    <div className="col-12 mb-5 ads-banner">
      <div
        className="border overflow-hidden"
        style={{ height: 'clamp(420px, 100vh, 720px)', borderRadius: '27px' }}
      >
        <NoImage loading textSize="22px" />
      </div>
    </div>
  )

  return (
    <div className="col-12 mb-5 ads-banner">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1}
        loop={ads?.length > 1}
        grabCursor={true}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
      >
        {ads?.map((ad) => (
          <SwiperSlide key={ad._id}>
            {/* No onClick here — the card itself no longer navigates */}
            <div
              className="d-flex align-items-center justify-content-center border overflow-hidden position-relative"
              style={{
                minHeight: 'clamp(420px, 100vh, 720px)',
                borderRadius: '27px',
                // image na ho to dark-grey bg, taake white text readable rahe
                backgroundColor: ad.adsImages?.[0]?.url ? undefined : '#6c757d',
                backgroundImage: ad.adsImages?.[0]?.url ? `url('${ad.adsImages[0].url}')` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div
                className="w-100 h-100 position-absolute top-0 start-0 z-1"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.30)' }}
              />
              <div className="col-12 position-relative z-2 py-5">
                <div className="container h-100 d-flex align-items-center justify-content-center">
                  <div className="d-flex flex-wrap align-items-center">
                    <div className="col-12 col-lg-8 text-center text-lg-start text-white pe-lg-5 mb-4 mb-lg-0">
                      <h1 className="col-12 col-lg-11 mb-3" style={{ fontSize: 'calc(0.8rem + 2.2vw)' }}>
                        {ad.title}
                      </h1>
                      <div className="col-12 d-flex justify-content-center justify-content-lg-start mb-3 mb-lg-5">
                        <div
                          className='d-flex align-items-center rounded-pill px-2 py-1 btn-chat'
                          style={{ width: 'fit-content', height: '52px', cursor: 'pointer' }}
                          onClick={(e) => handleChatClick(e, ad)}
                        >
                          <div
                            className="d-flex align-items-center justify-content-center bg-white rounded-circle me-2"
                            style={{ width: '37px', height: '37px' }}
                          >
                            <IconMessageCircle2 size={20} className="text-dark" />
                          </div>
                          <p className="mb-0 me-3">Chatting Now</p>
                        </div>
                      </div>
                      <p
                        className="col-12 col-lg-8 mb-0"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ad.description}
                      </p>
                    </div>

                    <div className="col-12 col-lg-4">
                      <div className="card p-3 py-4 rounded-4">
                        <div className="col-12 d-flex align-items-center mb-1">
                          <IconBox size={20} className="me-2" />
                          <p className="mb-0" style={{ fontSize: '1.1rem' }}>Find mobiles</p>
                        </div>
                        <p className="small text-body-secondary">Find the best mobile deals near you.</p>

                        <div className="col-12 mb-3">
                          <label className="form-label text-body-secondary">Location</label>
                          <div className="position-relative">
                            <IconMapPin size={20} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                            <input
                              type="text"
                              className="form-control rounded-3 py-3"
                              value={ad.address || ''}
                              disabled
                              style={disabledInputStyle}
                            />
                          </div>
                        </div>

                        <div className="row g-2 mb-3">
                          <div className="col-12 col-lg-6">
                            <label className="form-label text-body-secondary">Country</label>
                            <div className="position-relative">
                              <IconMap2 size={20} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                              <input
                                type="text"
                                className="form-control rounded-3 py-3"
                                value={ad.country || ''}
                                disabled
                                style={disabledInputStyle}
                              />
                            </div>
                          </div>
                          <div className="col-12 col-lg-6">
                            <label className="form-label text-body-secondary">City</label>
                            <div className="position-relative">
                              <IconCompass size={20} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                              <input
                                type="text"
                                className="form-control rounded-3 py-3"
                                value={ad.city || ''}
                                disabled
                                style={disabledInputStyle}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-12 mb-4">
                          <label className="form-label text-body-secondary">Amount</label>
                          <div className="position-relative">
                            <IconBuildingBank size={20} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                            <input
                              type="text"
                              className="form-control rounded-3 py-3"
                              value={ad.price != null ? `Rs ${Number(ad.price).toLocaleString()}` : ''}
                              disabled
                              style={disabledInputStyle}
                            />
                          </div>
                        </div>

                        <div className="col-12">
                          <button
                            className="col-12 rounded-pill small btn btn-dark py-3"
                            onClick={(e) => handleViewAd(e, ad)}
                          >
                            Click Here
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default AdsBanner