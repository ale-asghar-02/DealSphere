import { Link } from 'react-router-dom'
import { IconArrowUpRight } from '@tabler/icons-react'
import homePageLogo from '@/assets/images/home-page-logo.avif'

const navLinks = [
  { to: '/deals', label: 'Deal' },
  { to: '/design', label: 'Genio' },
  { to: '/services', label: 'Services' },
  { to: '/products', label: 'Products' },
]

const toolLinks = [
  { to: '/help-center', label: 'Help Center' },
  { to: '/contact/submit', label: 'Contact Us' },
  { to: '/dealsphere-for-businesses', label: 'DealSphere for Businesses' },
]

const FooterLink = ({ to, label }) => (
  <Link className='footer-link' to={to}>
    <p className='mb-0'>{label}</p>
    <IconArrowUpRight className='footer-arrow-right' size={16} />
  </Link>
)

const Footer = () => {
  return (
    <div className='col-12 px-4 px-lg-5 py-5 footer-section'>
      <div className="col-12 mb-4">
        <img className='w-100 object-fit-fill' src={homePageLogo} alt="white-logo" />
      </div>

      <div className="row text-white">
        <div className="col-12 col-lg-4 pe-lg-5">
          <Link to='/'>
            <img className='mb-2' src={homePageLogo} width='160px' alt="dealsphere-logo" />
          </Link>
          <p className='mb-0 text-secondary'>
            A trusted platform to connect buyers and sellers locally, making it easy to buy and sell with confidence.
          </p>
        </div>

        <div className="col-6 col-md-6 col-lg-2" style={{ marginTop: '12px' }}>
          <p className='fs-5 mb-2'>Navigation</p>
          {navLinks.map((link) => <FooterLink key={link.to} {...link} />)}
        </div>

        <div className="col-6 col-md-6 col-lg-2" style={{ marginTop: '12px' }}>
          <p className='fs-5 mb-2'>Tools</p>
          {toolLinks.map((link) => <FooterLink key={link.to} {...link} />)}
        </div>

        <div className="col-6 col-md-6 col-lg-2 text-secondary" style={{ marginTop: '12px' }}>
          <p className='fs-5 text-white mb-2'>Address</p>
          <p className='mb-0'>26000</p>
          <p className='mb-0'>Shah Abad , Jarwanda</p>
          <p className='mb-0'>Kohat</p>
        </div>

        <div className="col-6 col-md-6 col-lg-2 text-secondary" style={{ marginTop: '12px' }}>
          <p className='fs-5 text-white mb-2'>Contact</p>
          <p className='mb-0 text-break'>Support@dealSphere.com</p>
          <p className='mb-0'>+92 (313) 9722059</p>
        </div>
      </div>

      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between text-secondary pt-3">
        <p className='mb-0'>Copyright© DealSphere 2026</p>
        <div className='d-flex align-items-center gap-2'>
          <Link className='footer-link' to='/privacy-policy'>
            <p className='mb-0'>Privacy Policy</p>
          </Link>
          <Link className='footer-link' to='/terms-of-use'>
            <p className='mb-0'>Terms of Use</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Footer