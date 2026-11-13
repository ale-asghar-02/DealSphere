import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'

import { IconArrowNarrowRightDashed, IconArrowRight, IconBrandTwitter, IconBrandGithub, IconBrandInstagram } from '@tabler/icons-react'

import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer'

import SearchBar from '@/features/search/components/SearchBar'
import CategoryItems from '@/features/category/pages/CategoryItems'

// Deal images
import dealImg1 from '@/assets/images/deal-img-1.avif'
import dealImg2 from '@/assets/images/deal-img-2.avif'
import dealImg3 from '@/assets/images/deal-img-3.avif'
import dealImg4 from '@/assets/images/deal-img-4.avif'
import dealImg5 from '@/assets/images/deal-img-5.avif'
import dealImg6 from '@/assets/images/deal-img-6.avif'

// Team images
import teamImg1 from '@/assets/images/our-team-1.avif'
import teamImg2 from '@/assets/images/our-team-2.avif'
import teamImg3 from '@/assets/images/our-team-3.avif'
import teamImg4 from '@/assets/images/our-team-4.avif'
import teamImg5 from '@/assets/images/our-team-5.avif'
import teamImg6 from '@/assets/images/our-team-6.avif'

const teamMembers = [
  { img: teamImg1, name: 'James Carter', role: 'Ads Campaigns & Promotion' },
  { img: teamImg2, name: 'Mitchell Gray', role: 'Product Listing & Pricing Strategy' },
  { img: teamImg3, name: 'Daniel Smith', role: 'Sales Growth & Partnerships' },
  { img: teamImg4, name: 'Emily Johnson', role: 'Digital Marketer' },
  { img: teamImg5, name: 'William Taylor', role: 'Customer Support' },
  { img: teamImg6, name: 'Ethan Parker', role: 'Buyer/Seller Communication' },
]

const Deals = () => {
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

      <div className='deal-section mx-lg-4 pb-5'>
        <div className="col-12 col-lg-8 py-0 py-md-3 py-lg-5 pb-lg-4">
          <h1 className='text-center text-lg-start fw-bold lh-sm py-lg-5' style={{ fontSize: 'calc(1rem + 3.8vw)' }}>
            Everything you need to buy, sell in One Smart <span className="animated-text">Marketplace</span>
          </h1>
        </div>

        <div className="col-12 d-flex flex-wrap align-items-center">
          <div className="col-12 col-lg-8 col-xl-7 d-flex mb-3 mb-md-0">
            <div className="d-none d-lg-flex">
              <div className='position-relative pt-2' style={{ width: '100px' }}>
                <div className='posiion-absolute top-0 start-0 bg-dark rounded-pill' style={{ height: '3px' }}></div>
              </div>
            </div>
            <div className="col px-2 px-lg-4">
              <h3 className='text-center text-lg-start fw-semibold' style={{ fontSize: 'calc(0.8rem + 1.1vw)' }}>
                Our platform makes it easy to buy and sell products, post ads, and connect with genuine buyers and sellers nearby. From electronics to vehicles, we provide a smooth, secure, and fast online trading experience.
              </h3>
            </div>
          </div>
          <div className="col-12 col-lg-3 col-xl-4 d-flex align-items-center justify-content-end">
            <div className="circle-wrapper">
              <svg viewBox="0 0 200 200" className="rotating-text">
                <defs>
                  <path
                    id="circlePath"
                    d="M 100, 100
                       m -75, 0
                        a 75,75 0 1,1 150,0
                        a 75,75 0 1,1 -150,0"
                  />
                </defs>
                <text fill="#000" fontSize="16" fontWeight="400" letterSpacing="2">
                  <textPath className='fw-medium' href="#circlePath">
                    BUY • SELL • POST ADS • FIND DEALS • CONNECT •
                  </textPath>
                </text>
              </svg>
              <div className="center-icon">
                <IconArrowNarrowRightDashed size={35} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 py-5">
          <Swiper
            className='py-lg-5'
            modules={[Mousewheel]}
            spaceBetween={15}
            slidesPerView={'auto'}
            grabCursor={true}
            mousewheel={true}
            style={{ height: "92vh" }}
          >
            <SwiperSlide className="col-12 col-md-5 col-lg-4 rounded overflow-hidden">
              <img className='w-100 h-100 object-fit-cover' src={dealImg1} alt="deal-img-1" />
            </SwiperSlide>

            <SwiperSlide className='col-12 col-md-5 col-lg-4 position-relative'>
              <div className="rounded mb-3 overflow-hidden" style={{ height: "64%" }}>
                <img className='w-100 h-100 object-fit-cover' src={dealImg2} alt="deal-img-2" />
              </div>
              <div className="col-12 px-3 px-lg-0">
                <h3>What we believe in.</h3>
                <p className='text-body-secondary'>
                  We provide a seamless marketplace where users can post ads, explore products, and connect instantly. Our goal is to simplify online buying and selling with powerful tools and a smooth user experience.
                </p>
                <a className="icon-link icon-link-hover" href="#">
                  See Details
                  <IconArrowRight className="bi" size={16} />
                </a>
              </div>
              <div
                className="position-absolute d-flex justify-content-center"
                style={{ top: "100px", left: "-52.5px", zIndex: 10 }}
              >
                <div className='d-flex align-items-center justify-content-center rounded-pill bg-white text-dark' style={{ width: '90px', height: '88px' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 18 12 12 18 6" />
                    <polyline points="30 18 36 12 30 6" />
                  </svg>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide className='col-12 col-md-5 col-lg-4 rounded overflow-hidden' style={{ height: '81%' }}>
              <img className='w-100 h-100 object-fit-cover' src={dealImg3} alt="deal-img-3" />
            </SwiperSlide>

            <SwiperSlide className='col-12 col-md-5 col-lg-4 rounded overflow-hidden'>
              <img className='w-100 h-100 object-fit-cover' src={dealImg4} alt="deal-img-4" />
            </SwiperSlide>

            <SwiperSlide className='col-12 col-md-5 col-lg-4'>
              <div className="rounded overflow-hidden" style={{ height: '50%' }}>
                <img className='w-100 h-100 object-fit-cover' src={dealImg5} alt="deal-img-5" />
              </div>
              <div className="d-flex align-items-center" style={{ height: '30%' }}>
                <div className='px-3 px-lg-0'>
                  <p className='mb-0 fw-medium fs-5'>Simple & Instant Online Marketplace</p>
                  <p className='mb-0 text-body-secondary'>
                    A seamless marketplace to post ads, explore products, and connect instantly—making online buying and selling simple and smooth.
                  </p>
                </div>
              </div>
              <div className="rounded overflow-hidden" style={{ height: '20%' }}>
                <img className='w-100 h-100 object-fit-cover' src={dealImg6} alt="deal-img-6" />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>

        <div className="col-12 border-top border-bottom py-5 mb-5">
          <div className="col-12 d-flex flex-wrap align-items-center px-3 p-lg-5">
            <div className="col-12 col-md-6">
              <h1 className='mb-md-0 fw-bold' style={{ fontSize: 'calc(1rem + 2.5vw)' }}>Smart marketplace & fast transactions</h1>
            </div>
            <div className="col-12 col-md-6">
              <h3 className='mb-0 fw-semibold' style={{ fontSize: 'calc(0.6rem + 1vw)' }}>
                We are a modern classifieds platform focused on connecting buyers and sellers. Our system allows users to list products, chat in real-time, and close deals quickly with a user-friendly interface.
              </h3>
            </div>
          </div>
        </div>

        <div className="col-12 px-3 px-lg-0 py-lg-5">
          <div className="col-12 col-lg-8 pe-lg-5">
            <div className="col pe-lg-5">
              <h1 className='mb-0 fw-bold' style={{ fontSize: 'calc(1rem + 2.5vw)' }}>
                Meet our expert team, proudly built for smart, fast, and secure deals
              </h1>
              <p className='text-body-secondary'>
                Our platform is designed to make online trading easy for everyone. Whether you're selling unused items or looking for the best deals, we provide tools to help you succeed.
              </p>
            </div>
          </div>

          <div className="col-12 py-4">
            <Swiper
              modules={[Mousewheel]}
              spaceBetween={15}
              slidesPerView={'4'}
              grabCursor={true}
              mousewheel={true}
              breakpoints={{
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                992: { slidesPerView: 3 },
                1200: { slidesPerView: 4 },
              }}
              style={{ height: "70vh" }}
            >
              {teamMembers.map((member, index) => (
                <SwiperSlide key={member.name} className="col-12 col-md-5 col-lg-4 rounded">
                  {index === 1 ? (
                    <div className='col-12 mb-3 position-relative' style={{ height: '80%' }}>
                      <div className='col-12 h-100 rounded overflow-hidden'>
                        <img className='w-100 h-100 object-fit-cover' src={member.img} alt={`our-team-${index + 1}`} />
                      </div>
                      <div
                        className="position-absolute d-flex justify-content-center"
                        style={{ top: "38%", left: "-52.5px", zIndex: 10 }}
                      >
                        <div className='d-flex align-items-center justify-content-center rounded-pill bg-white text-dark' style={{ width: '90px', height: '88px' }}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="18 18 12 12 18 6" />
                            <polyline points="30 18 36 12 30 6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='rounded overflow-hidden mb-3' style={{ height: '80%' }}>
                      <img className='w-100 h-100 object-fit-cover' src={member.img} alt={`our-team-${index + 1}`} />
                    </div>
                  )}

                  <div className="col-12 d-flex align-items-center justify-content-betwen">
                    <div className="col"><h4>{member.name}</h4></div>
                    <div className="col d-flex align-items-center justify-content-end gap-2">
                      <div className='d-flex align-items-center justify-content-center border border-secondary-subtle rounded-pill' style={{ width: '40px', height: '40px' }}>
                        <IconBrandTwitter size={18} className='text-body-secondary' />
                      </div>
                      <div className='d-flex align-items-center justify-content-center border border-secondary-subtle rounded-pill' style={{ width: '40px', height: '40px' }}>
                        <IconBrandGithub size={18} className='text-body-secondary' />
                      </div>
                      <div className='d-flex align-items-center justify-content-center border border-secondary-subtle rounded-pill' style={{ width: '40px', height: '40px' }}>
                        <IconBrandInstagram size={18} className='text-body-secondary' />
                      </div>
                    </div>
                  </div>
                  <p className='mb-0 text-body-secondary'>{member.role}</p>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        <div className="col-12  px-3 px-lg-0 py-lg-5 mb-5">
          <div className="col-12 d-flex flex-wrap align-items-center py-lg-5">
            <div className="col-12 col-md-6 px-lg-5">
              <h1 className='mb-md-0 fw-bold' style={{ fontSize: 'calc(1rem + 2.5vw)' }}>Join our platform & start selling todays</h1>
            </div>
            <div className="col-12 col-md-6 px-lg-5">
              <p className='text-body-secondary'>
                We firmly believe anyone can easily turn their products into great opportunities. Whether you're a small seller or a growing business, our platform gives you the tools to reach the right audience.
              </p>
              <a className="icon-link icon-link-hover text-dark fw-medium text-decoration-none" href="#">
                See Open Position
                <IconArrowRight className="bi" size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Deals