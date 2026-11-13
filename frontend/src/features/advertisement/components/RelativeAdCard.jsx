import { useNavigate, useLocation } from 'react-router-dom';
import { IconMapPin, IconCash } from '@tabler/icons-react';
import ContactSellerButton from './ContactSellerButton';
import ItemChatButton from '../../chat/components/ItemChatButton';
import { Shimmer, NoImage } from '@/components/Shimmer';

// item = {} pass karo (ya kuch bhi na do) to loading (shimmer) state dikhegi
const RelativeAdCard = ({ item = {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // item._id nahi hai => loading state (shimmer)
  const isLoading = !item._id;

  const handleViewAd = () => {
    if (isLoading) return;

    const categorySlug = item.category?.slug;
    const subSlug = item.subCategory?.slug || 'all';

    navigate({
      pathname: `/advertisement/${categorySlug}/${subSlug}/${encodeURIComponent(item.title)}-${item._id}`,
      search: location.search,
    });
  };

  return (
    <div
      className="card p-2 h-100"
      style={{ cursor: isLoading ? 'default' : 'pointer' }}
      onClick={handleViewAd}
    >

      <div className='border rounded-2 overflow-hidden mb-2' style={{ width: '100%', height: '28vh' }}>
        {item.adsImages?.[0]?.url ? (
          <img
            className='w-100 h-100 object-fit-cover'
            src={item.adsImages[0].url}
            alt={item.title}
          />
        ) : (
          // loading: shimmer bg + center mein chhota "No Image Available"
          // loaded (image nahi): grey bg + center mein chhota "No Image Available"
          <NoImage loading={isLoading} />
        )}
      </div>

      {isLoading ? (
        <>
          {/* Title */}
          <Shimmer width="80%" height="20px" className="mb-2" />

          {/* Price */}
          <Shimmer width="55%" height="16px" className="mb-2" />

          {/* Location */}
          <Shimmer width="70%" height="16px" className="mb-3" />

          {/* Buttons */}
          <div className="d-flex align-items-center gap-2">
            <Shimmer width="110px" height="34px" />
            <Shimmer width="90px" height="34px" />
          </div>
        </>
      ) : (
        <>
          <h6 className='col-12 text-truncate mb-1'>{item.title}</h6>

          <p className='small mb-1 text-body-secondary d-flex flex-wrap align-items-center gap-1'>
            <IconCash size={16} stroke={1.5} />
            <span>Price :</span>
            <span className='text-dark'>Rs {item.price?.toLocaleString()}</span>
            {item.isPriceNegotiable && (
              <span className="text-success" style={{ fontSize: '12px' }}>{"(Negotiable)"}</span>
            )}
          </p>

          <p className="small text-body-secondary d-flex flex-wrap align-items-center gap-1 mb-2">
            <IconMapPin size={16} stroke={1.5} />
            <span>Location :</span>
            <span className="text-dark">{[item.city, item.country].filter(Boolean).join(", ")}</span>
          </p>

          <div className="d-flex align-items-center gap-2 me-5">
            <ContactSellerButton ad={item} />
            <ItemChatButton ad={item} />
          </div>
        </>
      )}

    </div>
  );
};

// Swiper ke breakpoints jitne cards ek row mein: 1 / 2 / 3 / 4 / 5
const skeletonColClass = (index) => {
  const base = 'col-12 col-md-6 col-lg-4 col-xl-3 col-xxl';
  if (index === 0) return base;
  if (index === 1) return `${base} d-none d-md-block`;
  if (index === 2) return `${base} d-none d-lg-block`;
  if (index === 3) return `${base} d-none d-xl-block`;
  return `${base} d-none d-xxl-block`;
};

// Parent mein loading ke waqt ye lagao: poori row skeleton cards ki
export const RelativeAdSkeletonRow = () => (
  <div className="row g-3">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className={skeletonColClass(i)}>
        <RelativeAdCard />
      </div>
    ))}
  </div>
);

export default RelativeAdCard;