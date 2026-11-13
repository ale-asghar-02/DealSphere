import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconExclamationCircle } from '@tabler/icons-react'

import Navbar from '@/components/Navbar/Navbar'
import Modal from '@/components/Model'

import useWishlist from '../hooks/useWishlist'
import WishlistCard from '../components/WishlistCard'

const Wishlist = () => {
  const { wishlist, wishlistLoading, handleUnlikeWishlist, handleGetWishlist, handleClearWishlist } = useWishlist();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { handleGetWishlist() }, []);

  // no refetch needed anymore — hook updates state optimistically
  const handleUnlike = async (adId) => {
    await handleUnlikeWishlist(adId);
  };

  const confirmClearAll = async () => {
    setClearing(true);
    const success = await handleClearWishlist();
    setClearing(false);
    if (success) setShowClearModal(false);
  };

  const list = wishlist || [];

  const activeList = list.filter((ad) => ad.status === 'active');
  const inactiveList = list.filter((ad) => ad.status !== 'active');

  const filteredDeals = () => {
    if (activeFilter === 'active') return activeList;
    if (activeFilter === 'inactive') return inactiveList;
    return list;
  };

  const uniqueCategories = Array.from(
    new Map(list.map((ad) => [ad.category?._id, ad.category]).filter(([id]) => id)).values()
  );

  return (
    <div>
      <Navbar />
      <div className="container py-3" style={{ marginBottom: '120px' }}>
        {/* Header */}
        <div className="col-12 d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-semibold mb-0" style={{ fontSize: 'calc(1rem + 0.5vw)' }}>
            Favorite Deals <span className="text-body-secondary fw-normal fs-6">({list.length} saved)</span>
          </h4>
          {list.length > 0 && (
            <button className="btn btn-sm btn-outline-danger" onClick={() => setShowClearModal(true)} disabled={wishlistLoading}>
              Clear All
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="col-12 d-flex flex-wrap align-items-center gap-2 mb-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`d-flex align-items-center gap-2 small border rounded-1 px-2 py-1 ${activeFilter === 'all' ? 'text-white bg-primary border-primary' : 'text-body-secondary bg-transparent'}`}
            style={{ width: 'fit-content' }}
          >
            <i className="bi bi-collection" style={{ marginTop: '1px' }}></i>
            All <span style={{ fontSize: '12px' }}>({list.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('active')}
            className={`d-flex align-items-center gap-2 small border rounded-1 px-2 py-1 ${activeFilter === 'active' ? 'text-white bg-primary border-primary' : 'text-body-secondary bg-transparent'}`}
            style={{ width: 'fit-content' }}
          >
            <i className="bi bi-clock" style={{ marginTop: '1px' }}></i>
            Active <span style={{ fontSize: '12px' }}>({activeList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('inactive')}
            className={`d-flex align-items-center gap-2 small border rounded-1 px-2 py-1 ${activeFilter === 'inactive' ? 'text-white bg-primary border-primary' : 'text-body-secondary bg-transparent'}`}
            style={{ width: 'fit-content' }}
          >
            <i className="bi bi-x-circle" style={{ marginTop: '1px' }}></i>
            Inactive <span style={{ fontSize: '12px' }}>({inactiveList.length})</span>
          </button>
        </div>

        <hr />

        {wishlistLoading && list.length === 0 ? (
          <WishlistCard deal={{}} />
        ) : list.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <h5 className='text-dark'>Your wishlist is empty</h5>
            <p>Browse deals and hit the heart icon to save your favorites here.</p>
            <Link to="/advertisement/mobiles?sort=new" className="btn btn-outline-primary">Browse Deals</Link>
          </div>
        ) : (
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              {filteredDeals().length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-funnel fs-2 d-block mb-2"></i>
                  <p>No deals in this category.</p>
                </div>
              ) : (
                filteredDeals().map((deal) => (
                  <WishlistCard key={deal._id} deal={deal} onUnlike={handleUnlike} />
                ))
              )}
            </div>

            <div className="col-12 col-lg-4">
              <div className="card p-3 mb-3">
                <div className="col-12 d-flex align-items-center gap-2 mb-2">
                  <IconExclamationCircle size={20} color='red' />
                  <h5 className="fw-medium mb-0">About DealSphere</h5>
                </div>
                <p className="text-body-secondary">
                  DealSphere helps you save and track the best deals in your area. Your wishlist is personal — only you can see it.
                </p>
                <ul style={{ paddingLeft: '17px' }}>
                  <li>Save deals with one click</li>
                  <li>Track deal status in real time</li>
                  <li>Get notified when a deal goes live</li>
                </ul>
              </div>

              <div className="card p-3">
                <h5 className="fw-medium mb-3">Saved Categories</h5>
                {uniqueCategories.length === 0 ? (
                  <p className="text-body-secondary small mb-0">No categories yet.</p>
                ) : (
                  <div className="col-12 d-flex flex-wrap align-items-center gap-1">
                    {uniqueCategories.map((cat) => (
                      <span key={cat._id} className="small border rounded-1 px-3 py-1">{cat.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear All Confirm Modal */}
      <Modal
        show={showClearModal}
        onClose={() => !clearing && setShowClearModal(false)}
        title="Clear all favorites?"
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setShowClearModal(false)} disabled={clearing}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmClearAll} disabled={clearing}>
              {clearing ? "Clearing..." : "Yes, Clear All"}
            </button>
          </>
        }
      >
        <p className="mb-0">This action will remove all your saved deals from your wishlist. This cannot be undone.</p>
      </Modal>
    </div>
  )
}

export default Wishlist