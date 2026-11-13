import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/hooks/useAuth'
import useSubscription from '../hooks/useSubscription'
import { IconCheck, IconX, IconCrown, IconRocket, IconStar, IconAd2, IconShoppingBag, IconPhoto, IconInfinity, IconLoader2, IconSparkles, IconChevronDown, IconRefresh } from '@tabler/icons-react'

import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer'

const PLAN_META = {
  free: { icon: IconRocket, accent: 'text-secondary', border: 'border-secondary-subtle' },
  monthly: { icon: IconStar, accent: 'text-primary', border: 'border-primary' },
  yearly: { icon: IconCrown, accent: 'text-warning', border: 'border-warning' },
}

const PLAN_ORDER = { free: 0, monthly: 1, yearly: 2 }

const buildFaqs = (freePlan) => {
  const freeAds = freePlan?.maxAds ?? 7
  const freeProducts = freePlan?.maxProducts ?? 7

  return [
    {
      q: 'Can I switch plans later?',
      a: 'You can upgrade from Free to Monthly or Yearly, or from Monthly to Yearly, anytime. Your new limits apply right after payment. When you upgrade from Monthly to Yearly, the Yearly plan starts immediately and the remaining Monthly days do not carry over. You cannot switch from an active Yearly plan to Monthly.',
    },
    {
      q: 'Can I renew before my plan expires?',
      a: 'Yes. Renewing the same plan adds the new period on top of your remaining days, so you never lose time. You will also get reminders 7, 3 and 1 day before your plan expires.',
    },
    {
      q: 'What happens to my ads if my plan expires?',
      a: `You move to the Free plan (${freeAds} ads and ${freeProducts} products live at a time). Your existing listings stay online, but you cannot add new ones while you are over the Free limit. Featuring that came from your subscription ends too.`,
    },
    {
      q: 'Is this available for buyers too?',
      a: 'Subscriptions are for sellers only. Buyers can browse and purchase without any plan.',
    },
    {
      q: 'How do featured listings work?',
      a: 'Featured listings are shown at the top of relevant category and search pages. Featured slots are shared between your ads and products, so 10 slots can be 10 ads, 10 products, or any mix such as 3 ads and 7 products. On the Yearly plan every new ad and product is featured automatically.',
    },
    {
      q: 'Are ad limits and product limits shared?',
      a: 'No, they are tracked separately. For example, on the Monthly plan you get 100 ad slots and 100 product slots independently. Only active and pending listings use a slot. Sold, deleted, rejected and expired listings free their slot.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'Subscriptions are purchased securely through Stripe using a debit or credit card.',
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Monthly and Yearly plans run for their full duration once purchased. You can simply choose not to renew when the period ends.',
    },
    {
      q: 'Do featured slots roll over if unused?',
      a: 'No. Unused featured slots do not carry over, and featuring from your subscription ends when the plan ends.',
    },
  ]
}

const formatLimit = (value) => (value === -1 ? 'Unlimited' : value)

const SubscriptionPlan = () => {
  const navigate = useNavigate()
  const { user } = useAuth() // expects { user } with user.accountType ("buyer" | "seller")
  const [openFaq, setOpenFaq] = useState(null)

  const { plans, subscription, subscriptionLoading, handleReadAllPlans, handleReadSubscription, handlePurchaseSubscription } = useSubscription()

  useEffect(() => {
    handleReadAllPlans()
    if (user?.accountType === 'seller') {
      handleReadSubscription()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const isSeller = user?.accountType === 'seller'
  const activePlanName = (isSeller && subscription?.plan) || 'free'
  const activeDaysLeft = isSeller ? subscription?.daysLeft : null
  const freePlan = plans.find((p) => p.name === 'free')
  const faqs = buildFaqs(freePlan)

  const handlePlanClick = (plan) => {
    if (plan.name === 'free') return

    if (!user) {
      toast.info('Please login to continue')
      navigate('/login')
      return
    }

    if (!isSeller) {
      toast.error('Only sellers can purchase a subscription')
      return
    }

    if (PLAN_ORDER[plan.name] < PLAN_ORDER[activePlanName]) {
      toast.info('Your higher plan is still active. You can renew it when it is close to expiring.')
      return
    }

    // Monthly -> Yearly: remaining monthly days are not carried over
    if (activePlanName === 'monthly' && plan.name === 'yearly') {
      const ok = window.confirm(
        `Upgrading starts your Yearly plan right now. Your remaining ${activeDaysLeft ?? 0} Monthly day(s) will not carry over. Continue?`
      )
      if (!ok) return
    }

    handlePurchaseSubscription(plan.name)
  }

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <div className="bg-light-subtle border-bottom py-md-5">
        <div className="container py-5 text-center">
          <span className="badge bg-primary-subtle text-primary fw-medium px-3 py-2 rounded-pill mb-3">
            <IconSparkles size={16} className="me-1" />
            Subscription Plans
          </span>
          <h1 className="fw-bold mb-3">Post More. Get Featured. Sell Faster.</h1>
          <p className="text-secondary mx-auto mb-0" style={{ maxWidth: 620 }}>
            Whether you're clearing out a few items or running a full-time store, our plans give your ads and
            products the reach they need to sell quicker.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="container py-5">
        {subscriptionLoading && plans.length === 0 ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4 justify-content-center py-md-5">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.name] || PLAN_META.free
              const PlanIcon = meta.icon
              const isFree = plan.name === 'free'
              const isCurrent = plan.name === activePlanName
              const isDowngrade = PLAN_ORDER[plan.name] < PLAN_ORDER[activePlanName]
              const isRenewal = isCurrent && !isFree && isSeller
              const isPopular = plan.name === 'monthly'
              const disabled = isFree || isDowngrade || subscriptionLoading

              return (
                <div className="col-12 col-md-6 col-lg-4" key={plan.name}>
                  <div
                    className={`card h-100 shadow-sm border ${isCurrent ? 'border-success' : meta.border} position-relative`}
                    style={{ borderWidth: isCurrent || !isFree ? 2 : 1 }}
                  >
                    {isPopular && !isCurrent && (
                      <span className="badge bg-primary fw-medium position-absolute top-0 start-50 translate-middle rounded-pill px-3 py-2">
                        Most Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="badge bg-success fw-medium position-absolute top-0 start-50 translate-middle rounded-pill px-3 py-2">
                        <IconCheck size={14} className="me-1" />
                        Active Plan
                      </span>
                    )}

                    <div className="card-body d-flex flex-column p-4 pt-5">
                      <div className={`mb-3 ${meta.accent}`}>
                        <PlanIcon size={36} stroke={1.5} />
                      </div>

                      <h4 className="fw-bold text-capitalize mb-1">{plan.name}</h4>

                      <div className="mb-4">
                        {plan.hasActiveDiscount ? (
                          <>
                            <span className="text-secondary text-decoration-line-through me-2" style={{ fontSize: '1.1rem' }}>
                              Rs. {plan.price.toLocaleString()}
                            </span>
                            <br />
                            <span className="display-6 fw-bold text-success">
                              Rs. {plan.effectivePrice.toLocaleString()}
                            </span>
                            <span className="badge bg-danger-subtle text-danger fw-medium ms-2 align-middle">
                              {plan.discountPercentage}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="display-6 fw-bold">
                            {plan.price === 0 ? 'Free' : `Rs. ${plan.price.toLocaleString()}`}
                          </span>
                        )}
                        {plan.durationInDays && (
                          <span className="text-secondary ms-1">
                            / {plan.durationInDays === 30 ? 'month' : 'year'}
                          </span>
                        )}
                      </div>

                      <ul className="list-unstyled mb-4 flex-grow-1">
                        <li className="d-flex align-items-center mb-3">
                          <IconAd2 size={18} className="text-success me-2 flex-shrink-0" />
                          <span>{formatLimit(plan.maxAds)} live ads</span>
                        </li>
                        <li className="d-flex align-items-center mb-3">
                          <IconShoppingBag size={18} className="text-success me-2 flex-shrink-0" />
                          <span>{formatLimit(plan.maxProducts)} live products</span>
                        </li>
                        <li className="d-flex align-items-center mb-3">
                          <IconPhoto size={18} className="text-success me-2 flex-shrink-0" />
                          <span>
                            Up to {formatLimit(plan.maxAdImages)} images per ad, {formatLimit(plan.maxProductImages)} per product
                          </span>
                        </li>
                        <li className="d-flex align-items-center mb-3">
                          {plan.featuredSlots === 0 ? (
                            <IconX size={18} className="text-danger me-2 flex-shrink-0" />
                          ) : (
                            <IconCheck size={18} className="text-success me-2 flex-shrink-0" />
                          )}
                          <span>
                            {plan.featuredSlots === 0
                              ? 'No featured listings'
                              : plan.featuredSlots === -1
                              ? 'Every new listing is featured'
                              : `${plan.featuredSlots} featured slots (ads + products combined)`}
                          </span>
                        </li>
                        {plan.featuredDurationDays > 0 && (
                          <li className="d-flex align-items-center mb-3">
                            <IconInfinity size={18} className="text-success me-2 flex-shrink-0" />
                            <span>Featured for up to {plan.featuredDurationDays} days</span>
                          </li>
                        )}
                      </ul>

                      <button
                        className={`btn ${isCurrent && isFree ? 'btn-outline-success' : 'btn-primary'} w-100 fw-medium`}
                        style={{ paddingBlock: '10px' }}
                        disabled={disabled}
                        onClick={() => handlePlanClick(plan)}
                      >
                        {subscriptionLoading && !isFree ? (
                          <IconLoader2 size={18} className="spin" />
                        ) : isFree ? (
                          isCurrent ? (
                            <>
                              <IconCheck size={18} className="me-1" />
                              Current Plan
                            </>
                          ) : (
                            'Default Plan'
                          )
                        ) : isDowngrade ? (
                          'Not Available'
                        ) : isRenewal ? (
                          <>
                            <IconRefresh size={18} className="me-1" />
                            Renew Plan
                          </>
                        ) : (
                          <span className="text-capitalize">{`Upgrade to ${plan.name}`}</span>
                        )}
                      </button>

                      {isRenewal && (
                        <p className="small text-secondary text-center mt-2 mb-0">
                          {activeDaysLeft != null ? `${activeDaysLeft} day(s) left. ` : ''}
                          Renewing adds {plan.durationInDays} more days on top.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-light-subtle border-top py-md-5">
        <div className="container py-5" style={{ maxWidth: 760 }}>
          <h3 className="fw-bold text-center mb-4">Frequently Asked Questions</h3>
          {faqs.map((faq, i) => (
            <div className="border-bottom py-3" key={i}>
              <button
                className="btn w-100 d-flex justify-content-between align-items-center text-start p-0 fw-semibold"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <IconChevronDown
                  size={18}
                  className="text-secondary flex-shrink-0"
                  style={{
                    transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
              {openFaq === i && <p className="text-secondary mt-2 mb-0 small">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <Footer />

    </div>
  )
}

export default SubscriptionPlan