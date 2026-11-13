import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconBuildingStore, IconArrowRight, IconCheck, IconChevronDown, IconHeadset, IconRocket, IconRosetteDiscountCheck, IconTags, IconTruckDelivery, IconWallet, IconShieldCheck, IconUserPlus, IconSpeakerphone, IconChartBar, IconLayoutDashboard } from "@tabler/icons-react";

import { AuthContext } from "@/features/auth/AuthContext";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/features/search/components/SearchBar";
import CategoryItems from "@/features/category/pages/CategoryItems";

import businessHeroImage from "@/assets/images/about-img-1.avif";
import businessDashboardImage from "@/assets/images/about-img-2.avif";

// ── CONSTANTS ──────────────────────────────────────────────────────────────

const TONES = {
  sky: { backgroundColor: "#e0f2fe", color: "#0284c7" },
  green: { backgroundColor: "#dcfce7", color: "#15803d" },
  amber: { backgroundColor: "#fef9c3", color: "#ca8a04" },
  red: { backgroundColor: "#fee2e2", color: "#dc2626" },
  violet: { backgroundColor: "#ede9fe", color: "#7c3aed" },
  orange: { backgroundColor: "#ffedd5", color: "#ea580c" },
};

const HERO_POINTS = ["Free basic listings", "EasyPaisa & JazzCash", "Support 7 days a week"];

const FEATURES = [
  {
    icon: IconTags,
    tone: "sky",
    title: "Free product & ad listings",
    desc: "Post products and classified ads on the same account. Basic listings are 100% free.",
  },
  {
    icon: IconRocket,
    tone: "orange",
    title: "Boost your visibility",
    desc: "Push your best listings higher in search results and category pages with optional paid packages.",
  },
  {
    icon: IconRosetteDiscountCheck,
    tone: "green",
    title: "Verified seller badge",
    desc: "Verify your account with a valid ID and selfie to earn a badge that builds buyer trust.",
  },
  {
    icon: IconTruckDelivery,
    tone: "violet",
    title: "Order management",
    desc: "Track every order from your dashboard, from processing all the way to delivered.",
  },
  {
    icon: IconWallet,
    tone: "amber",
    title: "Flexible payments",
    desc: "Buyers can pay with EasyPaisa, JazzCash, bank transfer, or cash on delivery.",
  },
  {
    icon: IconShieldCheck,
    tone: "red",
    title: "Trust & safety",
    desc: "Scam reports are reviewed within 24 hours, and confirmed scammers are permanently banned.",
  },
];

const STEPS = [
  { icon: IconUserPlus, title: "Create your account", desc: "Sign up in minutes and set up your seller profile." },
  { icon: IconRosetteDiscountCheck, title: "Get verified", desc: "Submit your ID and a selfie to earn the Verified badge." },
  { icon: IconSpeakerphone, title: "Post your listings", desc: "Add products or ads with clear photos, price and description." },
  { icon: IconChartBar, title: "Sell and grow", desc: "Manage orders, collect reviews and boost your best listings." },
];

const FREE_PLAN = [
  "Post products and classified ads",
  "Upload photos, price and description",
  "Edit your listing anytime",
  "Manage orders from your dashboard",
];

const BOOST_PLAN = [
  "Appear higher in search and category pages",
  "Choose the duration and budget that suit you",
  "Get more views and messages from buyers",
  "Boost any listing in a couple of taps",
];

const DASHBOARD_POINTS = [
  "Manage all your listings from My Listings",
  "Track every order from My Orders",
  "Get notified each time an order status changes",
  "Accept EasyPaisa, JazzCash, bank transfer and cash on delivery",
];

const FAQS = [
  {
    q: "Do I need a special account to sell as a business?",
    a: "No. Any DealSphere account can post product listings and classified ads. Verify your account to add a Verified badge and build buyer trust.",
  },
  {
    q: "Is it free to list my products?",
    a: "Basic listings are 100% free. Optional paid packages are available if you want to boost your visibility and reach more buyers.",
  },
  {
    q: "How do I get paid?",
    a: "Buyers can pay with EasyPaisa, JazzCash, bank transfer, or cash on delivery for eligible orders.",
  },
  {
    q: "Can I list products and classified ads together?",
    a: "Yes. DealSphere supports both product listings (buy/sell) and classified ads on the same account.",
  },
  {
    q: "What if someone tries to scam me?",
    a: "Report them from the listing page. Our Trust & Safety team reviews every report within 24 hours, and confirmed scammers are permanently banned.",
  },
];

// ── SMALL COMPONENTS ───────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="text-center mx-auto mb-5" style={{ maxWidth: 640 }}>
      {eyebrow && (
        <p className="text-uppercase fw-semibold mb-2" style={{ fontSize: 12, letterSpacing: ".1em", color: "#0284c7" }}>
          {eyebrow}
        </p>
      )}
      <h2 className="fw-bold text-dark mb-2" style={{ fontSize: "clamp(24px,4vw,34px)", letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-secondary mb-0" style={{ fontSize: 15, lineHeight: 1.7 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function FeatureCard({ icon: Icon, tone, title, desc }) {
  return (
    <div className="border rounded-4 p-4 h-100 bg-white shadow-sm">
      <div
        className="d-flex align-items-center justify-content-center rounded-3 mb-3"
        style={{ width: 48, height: 48, ...TONES[tone] }}
      >
        <Icon size={24} stroke={1.75} />
      </div>
      <h3 className="fw-semibold text-dark mb-2" style={{ fontSize: 16 }}>
        {title}
      </h3>
      <p className="text-secondary mb-0" style={{ fontSize: 13, lineHeight: 1.7 }}>
        {desc}
      </p>
    </div>
  );
}

function CheckList({ items, light = false }) {
  return (
    <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
      {items.map((item) => (
        <li key={item} className="d-flex align-items-start gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 mt-1"
            style={{
              width: 20,
              height: 20,
              backgroundColor: light ? "rgba(255,255,255,0.15)" : "#dcfce7",
              color: light ? "#fff" : "#15803d",
            }}
          >
            <IconCheck size={13} stroke={2.5} />
          </span>
          <span className={light ? "text-white" : "text-dark"} style={{ fontSize: 14 }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-3 overflow-hidden mb-2 bg-white">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-100 text-start border-0 d-flex justify-content-between align-items-center gap-3 px-3 py-3 bg-transparent"
      >
        <span className="fw-semibold text-dark" style={{ fontSize: 14 }}>
          {q}
        </span>
        <span
          className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${
            open ? "bg-dark text-white" : "bg-light text-secondary"
          }`}
          style={{ width: 26, height: 26, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
        >
          <IconChevronDown size={14} stroke={2} />
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 border-top bg-light" style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.75 }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────
const ForBusinesses = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const startSellingBtn = () => {
    if (!user) { toast.error("Need to login first"); return }

    if (user.accountType === "seller") {
      navigate("/user/dashboard", { state: { tab: "post-tab" } });
    } else {
      toast.error("You can't perform this action");
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="businesses-section overflow-hidden">
      <Navbar />

      <div className="container-fluid d-flex flex-wrap flex-md-nowrap align-items-center mx-lg-2 py-1 mb-2">
        <SearchBar type="ads" searchPath="/advertisement" wrapperClassName="col-md-5 col-lg-4 me-md-2" />
        <CategoryItems />
      </div>

      {/* ── HERO ── */}
      <section
        className="py-5"
        style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 55%, #f0fdf4 100%)" }}
      >
        <div className="container px-3 px-md-5 py-lg-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span
                className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 mb-3 fw-semibold"
                style={{ fontSize: 12, ...TONES.sky }}
              >
                <IconBuildingStore size={16} /> DealSphere for Businesses
              </span>

              <h1 className="fw-bold text-dark mb-3" style={{ fontSize: "clamp(30px,5vw,48px)", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Grow your business with <span style={{ color: "#0284c7" }}>DealSphere</span>
              </h1>
              <p className="text-secondary mb-4" style={{ fontSize: 16, lineHeight: 1.75, maxWidth: 520 }}>
                Reach thousands of local buyers, list your products and ads for free, and manage everything from one simple dashboard.
              </p>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <div 
                  onClick={ startSellingBtn } 
                  className="btn btn-dark rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2">
                  Start selling <IconArrowRight size={18} />
                </div>
                <button onClick={() => scrollToSection("how-it-works")} className="btn btn-outline-dark rounded-pill px-4 py-2">
                  See how it works
                </button>
              </div>

              <div className="d-flex flex-wrap gap-3">
                {HERO_POINTS.map((point) => (
                  <span key={point} className="d-inline-flex align-items-center gap-2 text-secondary" style={{ fontSize: 13 }}>
                    <IconCheck size={16} stroke={2.5} color="#15803d" /> {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-lg-6">
              <div className="position-relative">
                <img
                  src={businessHeroImage}
                  alt="A business owner selling on DealSphere"
                  className="w-100 rounded-4 shadow"
                  style={{ aspectRatio: "4 / 3", objectFit: "cover" }}
                />
                <div
                  className="d-none d-sm-flex align-items-center gap-2 bg-white rounded-3 shadow px-3 py-2 position-absolute"
                  style={{ left: -16, bottom: 28 }}
                >
                  <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 34, height: 34, ...TONES.green }}>
                    <IconRosetteDiscountCheck size={20} />
                  </span>
                  <div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13, lineHeight: 1.2 }}>
                      Verified seller
                    </div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      Builds buyer trust
                    </div>
                  </div>
                </div>
                <div
                  className="d-none d-sm-flex align-items-center gap-2 bg-white rounded-3 shadow px-3 py-2 position-absolute"
                  style={{ right: -12, top: 28 }}
                >
                  <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 34, height: 34, ...TONES.orange }}>
                    <IconRocket size={20} />
                  </span>
                  <div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13, lineHeight: 1.2 }}>
                      Boost listings
                    </div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      Reach more buyers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-5">
        <div className="container px-3 px-md-5 py-lg-4">
          <SectionHeading
            eyebrow="Why DealSphere"
            title="Everything you need to sell online"
            subtitle="From your first listing to your hundredth order, we give you the tools to sell with confidence."
          />
          <div className="row g-3 g-lg-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="col-12 col-md-6 col-lg-4">
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-5" style={{ backgroundColor: "#f8fafc" }}>
        <div className="container px-3 px-md-5 py-lg-4">
          <SectionHeading
            eyebrow="How it works"
            title="Start selling in four simple steps"
            subtitle="No complicated setup. You can have your first listing live in minutes."
          />
          <div className="row g-3 g-lg-4">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="col-12 col-md-6 col-lg-3">
                  <div className="border rounded-4 p-4 h-100 bg-white text-center">
                    <div className="position-relative d-inline-block mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-dark text-white"
                        style={{ width: 56, height: 56 }}
                      >
                        <Icon size={26} stroke={1.5} />
                      </div>
                      <span
                        className="position-absolute d-flex align-items-center justify-content-center rounded-circle bg-white border fw-bold text-dark"
                        style={{ width: 24, height: 24, fontSize: 11, top: -6, right: -10 }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    <h3 className="fw-semibold text-dark mb-2" style={{ fontSize: 16 }}>
                      {step.title}
                    </h3>
                    <p className="text-secondary mb-0" style={{ fontSize: 13, lineHeight: 1.7 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD ── */}
      <section className="py-5">
        <div className="container px-3 px-md-5 py-lg-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <img
                src={businessDashboardImage}
                alt="Managing listings and orders on the DealSphere dashboard"
                className="w-100 rounded-4 shadow-sm border"
                style={{ aspectRatio: "4 / 3", objectFit: "cover" }}
              />
            </div>
            <div className="col-lg-6">
              <span
                className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 mb-3 fw-semibold"
                style={{ fontSize: 12, ...TONES.violet }}
              >
                <IconLayoutDashboard size={16} /> Seller dashboard
              </span>
              <h2 className="fw-bold text-dark mb-3" style={{ fontSize: "clamp(24px,4vw,34px)", letterSpacing: "-0.02em" }}>
                Run your business from one place
              </h2>
              <p className="text-secondary mb-4" style={{ fontSize: 15, lineHeight: 1.75 }}>
                Keep your listings, orders and payments organised so you can spend less time on admin and more time selling.
              </p>
              <CheckList items={DASHBOARD_POINTS} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FREE VS BOOSTED ── */}
      <section className="py-5" style={{ backgroundColor: "#f8fafc" }}>
        <div className="container px-3 px-md-5 py-lg-4">
          <SectionHeading
            eyebrow="Listings"
            title="Start free, boost when you are ready"
            subtitle="List for free as long as you like. Add a boost whenever you want more eyes on a listing."
          />
          <div className="row g-3 g-lg-4 justify-content-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="border rounded-4 p-4 h-100 bg-white">
                <h3 className="fw-bold text-dark mb-1" style={{ fontSize: 20 }}>
                  Free listing
                </h3>
                <p className="text-secondary mb-4" style={{ fontSize: 13 }}>
                  Everything you need to get started.
                </p>
                <CheckList items={FREE_PLAN} />
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-5">
              <div className="rounded-4 p-4 h-100 position-relative boosted-card">
                <span
                  className="position-absolute d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1 fw-semibold"
                  style={{ top: 20, right: 20, fontSize: 11, ...TONES.orange }}
                >
                  <IconRocket size={13} /> Optional
                </span>
                <h3 className="fw-bold text-white mb-1" style={{ fontSize: 20 }}>
                  Boosted listing
                </h3>
                <p className="mb-4" style={{ fontSize: 13, color: "#94a3b8" }}>
                  Get your best items seen by more buyers.
                </p>
                <CheckList items={BOOST_PLAN} light />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-5">
        <div className="container px-3 px-md-5 py-lg-4">
          <SectionHeading eyebrow="FAQ" title="Questions from sellers" subtitle="Quick answers before you get started." />
          <div className="mx-auto" style={{ maxWidth: 760 }}>
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-5">
        <div className="container px-3 px-md-5">
          <div
            className="rounded-4 text-center px-3 px-md-5 py-5 position-relative overflow-hidden"
            style={{ backgroundColor: "#0f172a" }}
          >
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                pointerEvents: "none",
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="position-relative">
              <h2 className="fw-bold text-white mb-2" style={{ fontSize: "clamp(24px,4vw,34px)", letterSpacing: "-0.02em" }}>
                Ready to grow your business?
              </h2>
              <p className="mx-auto mb-4" style={{ maxWidth: 520, fontSize: 15, color: "#94a3b8", lineHeight: 1.7 }}>
                Post your first listing today. It is free, and our team is here 7 days a week, 9am – 9pm PKT.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <div onClick={ startSellingBtn } className="btn btn-light rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2">
                  Start selling <IconArrowRight size={18} />
                </div>
                <Link to='/contact/submit' className="btn btn-outline-light rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2">
                  <IconHeadset size={18} /> Talk to our team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="row">
        <Footer />
      </div>
    </div>
  );
};

export default ForBusinesses;