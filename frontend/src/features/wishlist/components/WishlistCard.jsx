import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { IconHeart, IconSquareArrowUp, IconSquareArrowDown, IconSquareX, IconSquarePlus } from '@tabler/icons-react'

import { Shimmer, NoImage } from '@/components/Shimmer'

const WishlistCard = ({ deal = {}, onUnlike }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [unliking, setUnliking] = useState(false);

  // deal._id nahi hai => loading state (shimmer)
  const isLoading = !deal._id;

  const handleUnlike = async () => {
    setUnliking(true);
    await onUnlike(deal._id);
    setUnliking(false);
  };

  const filledImages = deal.adsImages?.length > 0
    ? deal.adsImages.map((img) => img.url)
    : [null];

  return (
    <div className="card p-3 mb-3">
      {/* Top Row */}
      <div className="col-12 d-flex flex-wrap align-items-center gap-3 mb-2">
        <div
          className="border rounded-2 overflow-hidden flex-shrink-0"
          style={{ width: '100px', height: '100px', cursor: isLoading ? 'default' : 'pointer' }}
          onClick={() => !isLoading && navigate(`/advertisement/${deal.category?.slug}/${deal.subCategory?.slug || 'all'}/${encodeURIComponent(deal.title)}-${deal._id}`)}
        >
          {deal.adsImages?.[0]?.url ? (
            <img className="w-100 h-100 object-fit-cover" src={deal.adsImages[0].url} alt={deal.title} />
          ) : (
            // chhoti image: loading mein shimmer bg + icon, loaded mein grey bg + icon (text nahi)
            <NoImage loading={isLoading} showIcon showText={false} iconSize={22} />
          )}
        </div>

        <div className="flex-grow-1">
          {isLoading ? (
            <>
              <div className="d-flex align-items-center gap-2 mb-2">
                <Shimmer width="120px" height="24px" />
                <Shimmer width="70px" height="22px" />
              </div>
              <Shimmer width="80%" height="16px" className="mb-2" />
              <div className="d-flex flex-wrap align-items-center gap-3">
                <Shimmer width="140px" height="14px" />
                <Shimmer width="100px" height="14px" />
              </div>
            </>
          ) : (
            <>
              <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                <h5 className="mb-0 me-1">{deal.category?.name}</h5>

                <button
                  className="d-flex align-items-center gap-1 border border-danger text-danger rounded-1 px-2 bg-transparent"
                  style={{ fontSize: '13px', paddingTop: '2px', cursor: 'pointer' }}
                  onClick={handleUnlike}
                  disabled={unliking}
                >
                  <IconHeart size={14} style={{ marginBottom: '2px' }} />
                  {unliking ? "Removing..." : "Unlike"}
                </button>
              </div>

              <p className="text-body-secondary mb-1"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {deal.title}
              </p>

              <div className="col-12 small d-flex flex-wrap align-items-center gap-1">
                <p className="mb-0 text-body-secondary">
                  Created: <span className="text-dark">{new Date(deal.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </p>
                <div className="bg-dark rounded-pill mx-2" style={{ width: '4px', height: '4px' }}></div>
                <p className="mb-0 text-body-secondary">
                  Amount: <span className="text-dark">Rs {deal.price?.toLocaleString()}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* More Details + Images Row */}
      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between mt-2">
        {isLoading ? (
          <>
            <Shimmer width="110px" height="18px" />
            <Shimmer width="110px" height="18px" />
          </>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => setShowDetails(!showDetails)}>
              <p className="mb-0 small text-body-secondary">More Details</p>
              {showDetails ? <IconSquareArrowUp stroke={1.5} size={20} className="text-body-secondary" /> : <IconSquareArrowDown stroke={1.5} size={20} className="text-body-secondary" />}
            </div>
            <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => setShowImages(!showImages)}>
              <span className="text-body-secondary small">More Images</span>
              {showImages ? <IconSquareX stroke={1.5} size={20} className="text-body-secondary" /> : <IconSquarePlus stroke={1.5} size={20} className="text-body-secondary" />}
            </div>
          </>
        )}
      </div>

      {/* More Details Dropdown */}
      {!isLoading && showDetails && (
        <div className="col-12 mt-2">
          <div className="row g-2 small">
            <div className="col-12 col-md-4">
              <div className="border rounded-2 p-2">
                <p className="text-body-secondary mb-1">Location</p>
                <p className="mb-0 fw-medium text-truncate">{[deal.city, deal.country].filter(Boolean).join(", ")}</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded-2 p-2">
                <p className="text-body-secondary mb-1">Sub Category</p>
                <p className="mb-0 fw-medium">{deal.subCategory?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded-2 p-2">
                <p className="text-body-secondary mb-1">Seller</p>
                <p className="mb-0 fw-medium">{deal.seller?.username || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swiper Images Dropdown - only mount when visible */}
      {!isLoading && showImages && (
        <div className="col-12 mt-2">
          <Swiper
            spaceBetween={10}
            slidesPerView={1.2}
            observer={true}
            observeParents={true}
            breakpoints={{
              576: { slidesPerView: 1.5 },
              768: { slidesPerView: 3 },
              992: { slidesPerView: 5 },
              1200: { slidesPerView: 6 },
            }}
          >
            {filledImages.map((img, index) => (
              <SwiperSlide key={index}>
                <div className="border bg-body-secondary rounded-3 d-flex align-items-center justify-content-center overflow-hidden"
                  style={{ height: '100px' }}>
                  {img ? (
                    <img src={img} alt={`img-${index}`} className="w-100 h-100 rounded-3" style={{ objectFit: 'cover' }} />
                  ) : (
                    // chhoti image: sirf icon
                    <NoImage showIcon showText={false} iconSize={20} className="rounded-3" />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  )
}

export default WishlistCard