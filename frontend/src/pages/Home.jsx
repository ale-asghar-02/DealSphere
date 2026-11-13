import { useNavigate } from 'react-router-dom'
import { IconArrowUpRight } from '@tabler/icons-react'

import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer'

import SearchBar from '@/features/search/components/SearchBar'
import CategoryItems from '@/features/category/pages/CategoryItems'
import AdsBanner from '@/features/advertisement/components/AdsBanner'
import RecommendedProducts from '@/features/product/components/RecommendedProducts'
import WatchVideoButton from '@/components/WatchVideoButton'

// Static images imported so the bundler resolves + hashes them for production/deploy
import mobileImg from '@/assets/images/mobile.avif'
import fashionImg from '@/assets/images/fashion.avif'
import kidsToyImg from '@/assets/images/kids-toy.avif'
import aboutImg1 from '@/assets/images/about-img-1.avif'
import aboutImg2 from '@/assets/images/about-img-2.avif'
import aboutImg3 from '@/assets/images/about-img-3.avif'
import homePageLogo from '@/assets/images/home-page-logo.avif'
import productBanner from '@/assets/images/product-banner.avif'
import videoBanner from '@/assets/images/video-banner.avif'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className='overflow-hidden'>
      <Navbar />

      <div className='container-fluid d-flex flex-wrap flex-md-nowrap align-items-center mx-lg-2 py-1 mb-2'>
        <SearchBar
          type="ads"
          searchPath="/advertisement"
          wrapperClassName="col-md-5 col-lg-4 me-md-2"
        />
        <CategoryItems />
      </div>

      <div className="home-section">
        <div className='container-fluid px-lg-3'>

          {/* ================= Mobile category ads banner ================= */}
          <AdsBanner categorySlug="mobiles" />

          {/* ================= Promo strip (static) ================= */}
          <div className="row g-2 py-lg-5 text-center text-lg-start mb-5">
            <div className="col-12 col-lg-2 pt-lg-1">
              <h3 className="fw-semibold mb-0 me-2">Big</h3>
              <h3 className="fw-semibold">Promo</h3>
            </div>
            <div className="col-12 col-lg-4">
              <h1 className="fw-semibold">Limited Time Offer Sell Faster, Reach More Buyers!</h1>
            </div>
            <div className="col-12 col-lg-5 ms-auto">
              <p className="col-12 col-lg-10 text-body-secondary mb-3">
                Boost your ads and increase their visibility across the platform, helping your listings stand out
                from others. Featured ads attract more attention from potential buyers, bringing in more views and
                improving your chances of selling quickly.
              </p>
              <p
                className="text-center text-white bg-dark rounded-pill mb-0 px-5 ms-auto ms-lg-0 me-auto"
                style={{ width: 'fit-content', paddingBlock: '12px', cursor: 'pointer' }}
                onClick={() => navigate('/advertisement')}
              >
                Promote Ad
              </p>
            </div>
          </div>

          {/* ================= Category shortcut cards (static) ================= */}
          <div className="row g-3 ads-shortcut-card mb-5">
            <div className="col-12 col-lg-3">
              <div
                className="col-12 card rounded-4 overflow-hidden position-relative"
                style={{ height: '240px', cursor: 'pointer' }}
                onClick={() => navigate('/advertisement/mobiles?sort=new')}
              >
                <img className="w-100 h-100 object-fit-cover" src={mobileImg} alt="Mobiles" />
                <div className="col-12 d-flex align-items-center justify-content-between position-absolute bottom-0 px-3 py-3">
                  <p className="text-white fs-5 mb-0">Smart Selling Tips</p>
                  <div className="bg-white rounded-pill d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <IconArrowUpRight className="arrow-icon" size={20} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="col-12 border bg-body-secondary rounded-4 p-5" style={{ minHeight: '420px' }}>
                <div className="col-12 d-flex justify-content-between mb-5">
                  <div className="col-6 col-lg-3">
                    <h2 className="fw-medium">Let's Explore Together</h2>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input className="form-check-input fs-2" type="checkbox" role="switch" />
                  </div>
                </div>
                <p className="text-body-secondary mb-0">
                  Discover the best deals and sell with ease! Browse through a wide range of products or post your
                  own ads in seconds. Connect with buyers and sellers instantly and make your marketplace
                  experience seamless
                </p>
              </div>
            </div>
            <div className="col-12 col-lg-3">
              <div
                className="col-12 card rounded-4 overflow-hidden position-relative"
                style={{ height: '420px', cursor: 'pointer' }}
                onClick={() => navigate('/advertisement/fashion-and-beauty?sort=new')}
              >
                <img className="w-100 h-100 object-fit-cover" src={fashionImg} alt="Fashion & Beauty" />
                <div
                  className="col-12 d-flex flex-column justify-content-between h-100 position-absolute bottom-0 px-3 py-3"
                  style={{ backgroundColor: '#00000025' }}
                >
                  <p className="text-white mt-3">
                    Get discounts on featured ads and boost your listings to reach more buyers, increase visibility,
                    and improve your chances of selling much faster and easier.
                  </p>
                  <div className="col-12 d-flex align-items-center justify-content-between">
                    <p className="text-white fs-5 mb-0">Special Promotions</p>
                    <div className="bg-white rounded-pill d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                      <IconArrowUpRight className="arrow-icon" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-2">
              <div
                className="col-12 card rounded-4 overflow-hidden position-relative"
                style={{ height: '220px', cursor: 'pointer' }}
                onClick={() => navigate('/advertisement/kids-and-baby-items?sort=new')}
              >
                <img className="w-100 h-100 object-fit-cover" src={kidsToyImg} alt="Kids" />
                <div className="col-12 h-100 d-flex align-items-center justify-content-center position-absolute">
                  <div className="bg-white rounded-pill d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <IconArrowUpRight className="arrow-icon" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="px-lg-1">

            {/* ================= About us (static) ================= */}
            <div
              className="d-flex align-items-center justify-content-center overflow-hidden position-relative px-3 pb-5 pb-lg-0"
              style={{ minHeight: 'clamp(480px, 90vh, 900px)' }}>
              <div className="row col-12 position-relative z-2 px-lg-3 py-md-5">
                <div className="col-12 col-md-6 p-0 mb-3 mb-md-0">
                  <h3 className="fw-semibold mb-0 me-2">About</h3>
                  <h3 className="fw-semibold">Us</h3>
                </div>
                <div className="col-12 col-md-6 p-0 mt-md-5 mb-5 mb-md-0">
                  <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                    <div className="bg-dark border rounded-4 overflow-hidden mb-3" style={{ height: '260px' }}>
                      <img className="w-100 h-100 object-fit-cover" src={aboutImg1} alt="About us" />
                    </div>
                    <p className="text-body-secondary mb-0">
                      Our marketplace connects people locally to buy and sell products securely, making the process
                      simple and fast.
                    </p>
                  </div>
                </div>
                <div className="col-12 col-md-6 p-0 d-flex justify-content-center">
                  <div className="border rounded-4 overflow-hidden" style={{ width: '200px', height: '200px' }}>
                    <img className="w-100 h-100 object-fit-cover" src={aboutImg2} alt="About us" />
                  </div>
                </div>
                <div className="col-12 col-md-6 p-0 d-flex align-items-end" style={{ height: 'calc(100px + 15vw)' }}>
                  <div className="col-0 col-md-8"></div>
                  <div className="border rounded-4 overflow-hidden ms-auto me-auto m-md-0" style={{ width: '120px', height: '120px' }}>
                    <img className="w-100 h-100 object-fit-cover" src={aboutImg3} alt="About us" />
                  </div>
                </div>
              </div>
              <div className="w-100 position-absolute z-1" style={{ bottom: 'clamp(-120px, -8vw, -30px)' }}>
                <img style={{ width: '200%' }} src={homePageLogo} alt="Marketplace logo" />
              </div>
            </div>

            {/* ================= Mega sale banner (static) ================= */}
            <div className="col-12 px-3 px-lg-4 py-5" style={{ backgroundColor: '#F4F4F4' }}>
              <div className="col-12 d-flex flex-wrap align-items-center py-lg-5 mb-3 mb-lg-0">
                <div className="col-12 col-lg-8"><h1>Mega Sale Event 2026</h1></div>
                <div className="col-12 col-lg-4 text-body-secondary">
                  <p className="mb-0">Don't miss out on exciting deals across all categories. Limited time offers available now!</p>
                </div>
              </div>
              <div
                className="col-12 d-flex align-items-end px-3 px-md-5 rounded-4 overflow-hidden"
                style={{
                  height: 'clamp(260px, 40vw, 480px)',
                  backgroundImage: `url('${productBanner}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <div className="col-12 col-md-8 col-lg-4 text-white">
                  <h2>Shop Quality Products</h2>
                  <p>Explore thousands of products from trusted sellers, all in one place.</p>
                  <div
                    className="d-flex justify-content-center justify-content-lg-start rounded-pill mb-3 mb-lg-5 browse-product-btn"
                    style={{ width: 'fit-content', height: '52px', cursor: 'pointer' }}
                  >
                    <div
                      className='d-flex align-items-center rounded-pill px-4 py-1'
                      onClick={() => navigate('/products')}
                      style={{ height: '52px', cursor: 'pointer' }}
                    >
                      <p className="mb-0 me-3">Browse Now</p>
                      <IconArrowUpRight size={18} style={{ transform: 'rotate(45deg)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= Recommended products ================= */}
            <RecommendedProducts />
          </div>

          {/* ================= Video section (static) ================= */}
          <div className="col-12 video-section" style={{ backgroundColor: '#F4F4F4' }}>
            <div className="position-relative overflow-hidden" style={{ height: 'clamp(300px, min(90vh, 80vw), 800px)' }}>
              <div className="col-12 h-100">
                <img className="w-100 h-100 object-fit-cover" src={videoBanner} alt="Marketplace video" />
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{ background: 'linear-gradient(to bottom, rgba(244,244,244,1) 35%, rgba(244,244,244,0) 100%)' }}
                ></div>
              </div>
              <div className="col-12 col-lg-8 px-2 position-absolute top-50 start-50" style={{ transform: 'translate(-50%, -50%)' }}>
                <h1 className="text-center fw-bold mb-4" style={{ fontSize: 'calc(1rem + 2.2vw)' }}>
                  Your local marketplace for everything you need and everything you no longer do.
                </h1>
                <div className="col-12 d-flex align-items-center justify-content-center">
                  <WatchVideoButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Home