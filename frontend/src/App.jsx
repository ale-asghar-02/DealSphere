import { Route, Routes, useLocation } from 'react-router-dom'

// Auth
import Register from '@/features/auth/pages/Register'
import Login from '@/features/auth/pages/Login'
import VerificationOTP from '@/features/auth/pages/VerificationOTP'
import ResetPassword from '@/features/auth/pages/ResetPassword'

// Public / Core
import Home from '@/pages/Home'
import Deals from '@/pages/Deals'
import Services from '@/pages/Services'
import Contact from '@/pages/Contact'
import HelpCenter from '@/features/article/pages/HelpCenter'
import ForBusinesses from '@/pages/ForBusinesses'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import TermsOfUse from '@/pages/TermsOfUse'
import SellerProfile from '@/pages/SellerProfile'

// Advertisement
import Advertisement from '@/features/advertisement/pages/Advertisement'
import SingleAdvertisement from '@/features/advertisement/pages/SingleAdvertisement'

// Product
import Product from '@/features/product/pages/Product'
import SingleProduct from '@/features/product/pages/SingleProduct'

// Subscription
import SubscriptionPlan from '@/features/subscription/pages/SubscriptionPlan'

// Design Studio
import DesignStudio from '@/features/design/pages/DesignStudio'
import DesignSession from '@/features/design/pages/DesignSession'
import DesignPricing from '@/features/design/pages/DesignPricing'

// Payment Result
import PaymentResult from '@/components/PaymentResult'

// Chat
import Chat from '@/features/chat/pages/Chat'

// Cart / Checkout / Wishlist
import Cart from '@/features/cart/pages/Cart'
import Checkout from '@/features/order/pages/Checkout'
import Wishlist from '@/features/wishlist/pages/Wishlist'

// User Dashboard
import UserDashboard from '@/features/dashboard/user/pages/UserDashboard'
import CreateAds from '@/features/dashboard/user/pages/CreateAds'
import CreateProduct from '@/features/dashboard/user/pages/CreateProduct'

// Admin Dashboard
import AdminDashboard from '@/features/dashboard/admin/pages/AdminDashboard'

// Announcement
import AnnouncementBanner from '@/components/AnnouncementBanner'

// Layout
import PublicLayout from '@/layouts/PublicLayout'

// Route Guards
import ProtectedRoute from '@/routes/ProtectedRoute'
import GuestRoute from '@/routes/GuestRoute'
import AdminRoute from '@/routes/AdminRoute'

// 404
import NotFound from '@/pages/NotFound'

const AUTH_PATHS = ['/register', '/login', '/verify-otp', '/reset-password']

const App = () => {
  const location = useLocation()
  const hideBanner = AUTH_PATHS.includes(location.pathname)

  return (
    <>
      {!hideBanner && <AnnouncementBanner />}

      <Routes>
        {/* Public — ChatbotWidget PublicLayout ke through inhi routes pe milega */}
        <Route element={<PublicLayout />}>
          <Route path='/' element={<Home />} />
          <Route path='/deals' element={<Deals />} />
          <Route path='/services' element={<Services />} />
          <Route path='/contact/submit' element={<Contact />} />
          <Route path='/help-center' element={<HelpCenter />} />
          <Route path='/dealsphere-for-businesses' element={<ForBusinesses />} />
          <Route path='/privacy-policy' element={<PrivacyPolicy />} />
          <Route path='/terms-of-use' element={<TermsOfUse />} />

          <Route path='/:item/:category/:subCategory/:slug/profile/:usernameSlug' element={<SellerProfile />} />

          {/* Advertisement */}
          <Route path='/advertisement' element={<Advertisement />} />
          <Route path='/advertisement/:categorySlug/:subSlug?' element={<Advertisement />} />
          <Route path='/advertisement/:categorySlug/:subSlug?/:adSlug?' element={<SingleAdvertisement />} />

          {/* Product */}
          <Route path='/products/:categorySlug?/:subSlug?' element={<Product />} />
          <Route path='/product/:categorySlug/:subSlug?/:productSlug?' element={<SingleProduct />} />

          {/* Subscription */}
          <Route path='/upgrade-plan' element={<SubscriptionPlan />} />

          {/* Design Studio pricing (public) */}
          <Route path='/design/pricing' element={<DesignPricing />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path='/user/dashboard' element={<UserDashboard />} />
          <Route path='/user/dashboard/create/ads' element={<CreateAds />} />
          <Route path='/user/dashboard/create/product' element={<CreateProduct />} />

          {/* Design Studio */}
          <Route path='/design' element={<DesignStudio />} />
          <Route path='/design/:id' element={<DesignSession />} />

          <Route path='/payment/success' element={<PaymentResult />} />
          <Route path='/payment/cancelled' element={<PaymentResult />} />

          {/* Chat */}
          <Route path='/chat' element={<Chat />} />
          <Route path='/chat/:itemId' element={<Chat />} />

          {/* Cart / Checkout / Wishlist */}
          <Route path='/cart' element={<Cart />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/checkout/:productId' element={<Checkout />} />
          <Route path='/wishlist' element={<Wishlist />} />
        </Route>

        {/* Admin Dashboard — login + role === "admin" required */}
        <Route element={<AdminRoute />}>
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
        </Route>

        {/* Auth — only logged-out users */}
        <Route element={<GuestRoute />}>
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/verify-otp' element={<VerificationOTP />} />
          <Route path='/reset-password' element={<ResetPassword />} />
        </Route>

        {/* 404 — koi route match na ho to */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App