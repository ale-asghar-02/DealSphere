import React from 'react'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer'

import SearchBar from '@/features/search/components/SearchBar'
import CategoryItems from '@/features/category/pages/CategoryItems'

import { IconPackage, IconTruckDelivery, IconShieldLock, IconTags, IconAd2, IconArrowsMinimize } from '@tabler/icons-react'

import serviceHeroImage from '@/assets/images/service-hero-image.avif'
import serviceImg1 from '@/assets/images/service-img-1.avif'
import serviceImg2 from '@/assets/images/service-img-2.avif'
import serviceImg3 from '@/assets/images/service-img-3.avif'
import serviceImg4 from '@/assets/images/service-img-4.avif'

const featureCards = [
  {
    icon: IconPackage,
    title: 'Buy Products Easily',
    desc: 'Find mobiles, laptops, furniture, vehicles, and many other products with just a few clicks.',
  },
  {
    icon: IconTruckDelivery,
    title: 'Sell Your Products Fast',
    desc: 'Upload your product, set a price, and reach thousands of buyers instantly.',
  },
  {
    icon: IconShieldLock,
    title: 'Secure User System',
    desc: 'User authentication and safe communication ensure a trusted buying and selling experience.',
  },
  {
    icon: IconTags,
    title: 'Category-Based Search',
    desc: 'Easily search products by category, price, or location to save time.',
  },
  {
    icon: IconAd2,
    title: 'Ad Management',
    desc: 'Users can edit, delete, or update their ads anytime from their dashboard.',
  },
  {
    icon: IconArrowsMinimize,
    title: 'Fast & Responsive Platform',
    desc: 'The website is fully responsive and works smoothly on mobile, tablet, and desktop devices.',
  },
]

const howItWorks = [
  {
    img: serviceImg1,
    title: 'Browse & Choose a Product',
    desc: 'Explore thousands of products from different categories and find exactly what you need at the best price.',
  },
  {
    img: serviceImg2,
    title: 'Fast Ad Posting',
    desc: 'Sell your products faster with our high-performance platform. Upload images, add product details, and publish your ad instantly without any delay.',
  },
  {
    img: serviceImg3,
    title: 'Connect with Buyers & Sellers',
    desc: 'Chat directly with users, negotiate prices confidently, and finalize the deal quickly and safely.',
  },
  {
    img: serviceImg4,
    title: 'Buy, Sell & Grow',
    desc: 'Make smart purchases, sell unused items, and grow your business through our platform.',
  },
]

const accordionItem = [
  {
    title: 'Authentication & Account Setup',
    content:
      'Create your account quickly using email or social login, and secure it with a strong password. Once registered, you can post ads, manage listings, and interact safely with buyers and sellers. Keeping your account verified ensures trust and smooth transactions.',
  },
  {
    title: 'Search & Discover Products',
    content:
      'Browse through a wide range of listings including electronics, fashion, vehicles, and more. Advanced filters help you find exactly what you’re looking for, whether it’s a brand-new gadget or a pre-loved item at a bargain price.',
  },
  {
    title: 'Manage Your Listings',
    content:
      'Keep track of all your active, sold, and expired ads. Edit details, update pricing, or remove items with a simple click. This ensures your listings remain accurate and attract serious buyers.',
  },
  {
    title: 'Secure Communication',
    content:
      'Chat directly with buyers and sellers through our in-platform messaging. Negotiate prices safely and ask questions about products without sharing personal information, ensuring secure and professional interactions.',
  },
  {
    title: 'Boost Your Ad Visibility',
    content:
      'Feature your ad to appear at the top of search results and reach more interested buyers. Highlighting your listings increases the chance of quick sales and improves visibility for high-demand products.',
  },
  {
    title: 'Track Performance & Insights',
    content:
      'Monitor views, clicks, and inquiries for each ad. Gain insights into buyer interest and engagement trends, helping you optimize your product descriptions and pricing strategy for better results.',
  },
  {
    title: 'Community & Support',
    content:
      'Connect with a trusted community of buyers and sellers. Access guidelines, tips for safe trading, and dedicated support to resolve any issues quickly. Make your buying and selling experience smooth, secure, and enjoyable.',
  },
]

const Services = () => {
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

      <div className='services-section mx-lg-4'>
        <div className="col-12 d-flex flex-wrap justify-content-center py-0 py-md-3 position-relative mb-3 mb-lg-0">
          <div className='col-12 col-lg-7 text-center py-lg-5'>
            <h1 className='text-center fw-bold lh-sm' style={{ fontSize: 'calc(1rem + 3.6vw)' }}>
              Complete <span className="service-animated-text">Marketplace</span> for Every Need
            </h1>
            <p className='text-body-secondary'>
              Buy, sell, and discover products near you in a fast, secure, and simple way. Our platform helps users connect easily and make smart deals without any complications.
            </p>
          </div>
          <div className="col-12 border rounded-3 overflow-hidden" style={{ height: "calc(10vh + 35vw)" }}>
            <img className='w-100 h-100 object-fit-cover' src={serviceHeroImage} alt="service-hero-image" />
          </div>

          <div
            className="position-absolute z-n1 bg-warning bg-opacity-75 rounded-pill"
            style={{
              width: "120px",
              height: "120px",
              top: '70px',
              left: '50px',
              filter: "blur(50px)",
            }}
          ></div>

          <div
            className="position-absolute z-n1 bg-warning bg-opacity-75 rounded-pill translate-middle"
            style={{
              width: "120px",
              height: "120px",
              bottom: '-50px',
              right: '-80px',
              filter: "blur(50px)",
            }}
          ></div>
        </div>

        <div className="col-12 d-flex flex-wrap justify-content-center py-0 py-md-3 pb-lg-4 mb-3 mb-lg-0">
          <div className='col-12 col-lg-7 text-center py-lg-5'>
            <h1 className='text-center fw-bold lh-sm' style={{ fontSize: 'calc(0.7rem + 2.8vw)' }}>
              Smart Marketplace for You & Your Business
            </h1>
            <p className='mb-0 text-body-secondary'>
              From daily-use products to professional items, we provide a simple online platform where everyone can buy and sell easily and securely.
            </p>
          </div>
        </div>

        <div className="row mb-3 mb-lg-0">
          {featureCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div className="col-12 col-md-6 col-lg-4 p-2" key={index}>
                <div className="col-12 border rounded-3 p-3 p-lg-4">
                  <div
                    className='d-flex align-items-center justify-content-center border border-primary rounded-pill mb-3'
                    style={{ width: '70px', height: '70px' }}
                  >
                    <Icon size={26} className='text-primary' />
                  </div>
                  <h4>{card.title}</h4>
                  <p className='mb-0 text-body-secondary'>{card.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="col-12 py-0 py-md-3 pb-lg-4 mb-3 mb-lg-0">
          <div className='col-12 col-lg-7 text-start py-lg-5'>
            <h1 className='fw-bold lh-sm' style={{ fontSize: 'calc(0.7rem + 2.8vw)' }}>How Our Marketplace Works</h1>
            <p className='mb-0 text-body-secondary'>A simple and smooth process to buy or sell anything in just a few easy steps — from browsing products to finalizing the deal, our platform guides you through every stage so you can trade with confidence and complete peace of mind.</p>
          </div>
        </div>

        <div className="row">
          {howItWorks.map((step, index) => (
            <div className="col-12 col-md-6 p-2" key={index}>
              <div className="col-12 bg-body-secondary bg-opacity-50 border rounded-3 p-3 p-lg-4">
                <div className='mb-3 border rounded-3 overflow-hidden' style={{ height: '55vh' }}>
                  <img className='w-100 h-100 object-fit-cover' src={step.img} alt={`service-img-${index + 1}`} />
                </div>
                <h4>{step.title}</h4>
                <p className='mb-0 text-body-secondary'>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="col-12 d-flex justify-content-center" style={{ height: '90vh', marginTop: 'calc(30px + 4vw)' }}>
          <div className='col-12 col-lg-7 px-3 px-lg-0'>
            <div className="accordion accordion-flush" id="accordionFlushExample">
              {accordionItem.map((item, index) => (
                <div className="accordion-item border-0" key={index}>
                  <h2 className="accordion-header">
                    <button
                      className="accordion-button collapsed border-bottom fw-medium px-0"
                      style={{ fontSize: '17px' }}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#flush-collapse${index}`}
                      aria-expanded="false"
                      aria-controls={`flush-collapse${index}`}
                    >
                      {item.title}
                    </button>
                  </h2>
                  <div
                    id={`flush-collapse${index}`}
                    className="accordion-collapse collapse"
                    data-bs-parent="#accordionFlushExample"
                  >
                    <div className="accordion-body border-bottom">{item.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Services