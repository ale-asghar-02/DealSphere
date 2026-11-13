import React, { useState } from "react";
import { Link } from "react-router-dom"
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";

import SearchBar from "@/features/search/components/SearchBar";
import CategoryItems from "@/features/category/pages/CategoryItems";

import termsHero from "@/assets/images/term-hero-img.avif";
import termsSupport from "@/assets/images/term-support-img.avif";

import {
  IconHome, IconChevronRight, IconChevronDown, IconCalendar, IconClockHour4,
  IconFileText, IconGavel, IconUserCheck, IconListDetails, IconBan,
  IconShoppingCart, IconWallet, IconCrown, IconSparkles, IconMessages,
  IconFlag, IconCopyright, IconScale, IconDoorExit, IconRefresh, IconMail,
  IconCheck, IconX, IconShieldCheck, IconHeadset, IconAlertTriangle,
} from "@tabler/icons-react";

/* ───────── data ───────── */

const highlights = [
  { icon: IconUserCheck, title: "18+ only", desc: "Adults can create accounts and trade." },
  { icon: IconShieldCheck, title: "Honest listings", desc: "Ads must be real, accurate and legal." },
  { icon: IconWallet, title: "Safe payments", desc: "Cash on delivery or Stripe, plus a seller wallet." },
  { icon: IconFlag, title: "Fair moderation", desc: "Reports are reviewed and you are told why." },
];

const clauses = [
  {
    icon: IconGavel, title: "Accepting these terms",
    intro: "By creating an account or using DealSphere you agree to these Terms of Use and to our Privacy Policy. If you do not agree, please do not use the platform.",
    points: ["These terms apply to buyers, sellers, guests and admins alike.", "Specific features, like subscriptions, may have extra rules shown at the time you use them."],
  },
  {
    icon: IconUserCheck, title: "Eligibility and your account",
    intro: "You must be at least 18 years old and able to enter a binding contract under Pakistani law.",
    points: ["Give accurate details when signing up and keep them up to date.", "Keep your password safe. You are responsible for activity under your account.", "One person, one account. Do not sell or transfer accounts.", "Tell us right away at security@dealsphere.pk if you think your account was accessed by someone else."],
  },
  {
    icon: IconListDetails, title: "Posting ads and products",
    intro: "You own what you post, and you are responsible for it being true and lawful.",
    points: ["Use real photos and honest descriptions, prices and conditions.", "Only list items you legally own or are allowed to sell.", "We may check, hold, edit or remove listings that break these terms, including through automated checks.", "Do not post duplicate ads to game search results."],
  },
  {
    icon: IconBan, title: "Prohibited items and conduct",
    intro: "To keep the marketplace safe, some things are never allowed on DealSphere.",
    points: ["Illegal goods, weapons, drugs, stolen or counterfeit items.", "Scams, fake listings, shill bidding or misleading offers.", "Harassment, hate speech, threats or spam in chats and listings.", "Scraping, hacking, or interfering with how the platform works."],
  },
  {
    icon: IconShoppingCart, title: "Orders and payments",
    intro: "You can buy through a cart or Buy Now, and pay by cash on delivery or online through Stripe.",
    points: ["An order is a deal between buyer and seller. DealSphere provides the platform.", "Sellers must ship what was described. Buyers must accept and pay for orders they place.", "Online payments are handled by Stripe and are subject to its terms.", "Buyers should confirm receipt only after they get the item."],
  },
  {
    icon: IconWallet, title: "Wallet and withdrawals",
    intro: "Seller earnings are credited to the wallet after the buyer confirms receipt.",
    points: ["You can request a withdrawal from your available wallet balance.", "We may delay or refuse withdrawals linked to fraud, disputes or unpaid dues.", "Transaction records are kept for accounting and dispute purposes."],
  },
  {
    icon: IconCrown, title: "Plans and featured ads",
    intro: "Sellers can choose a free, monthly or yearly plan, and pay to feature listings.",
    points: ["Plans set your listing limits and expiry dates.", "Featured ads run for the period you purchase and then return to normal.", "Fees paid for plans and featured ads are non-refundable unless the law or our published policy says otherwise."],
  },
  {
    icon: IconSparkles, title: "AI-assisted features",
    intro: "Autofill, the chat assistant and listing checks use AI to help you work faster.",
    points: ["AI output is a suggestion. Review it before you publish or rely on it.", "You are responsible for the final content of your listings.", "Do not enter sensitive personal details, such as ID numbers, into AI features."],
  },
  {
    icon: IconMessages, title: "Messages and communication",
    intro: "Use chat to ask questions and agree on deals, and keep it respectful.",
    points: ["Do not share abusive, unlawful or misleading content.", "Reported chats may be reviewed by admins to resolve disputes.", "We may send you service messages about orders, listings and your account."],
  },
  {
    icon: IconFlag, title: "Reports, warnings and suspension",
    intro: "Anyone can report an ad, product, seller or chat that looks wrong.",
    points: ["We review reports and may warn, suspend or ban accounts that break these terms.", "We notify you by email and in-app with the reason and duration.", "Serious violations, like fraud, can lead to immediate removal."],
  },
  {
    icon: IconCopyright, title: "Content and intellectual property",
    intro: "You keep ownership of your photos and text.",
    points: ["You give DealSphere a limited licence to display and promote your content on the platform, for example on posters and featured spots.", "Do not upload content you do not have the right to use.", "DealSphere's name, logo and design belong to us."],
  },
  {
    icon: IconScale, title: "Disclaimers and liability",
    intro: "DealSphere connects buyers and sellers. We are not a party to their sales.",
    points: ["We do not guarantee the quality, safety or legality of items listed by users.", "The platform is provided as available, and we do not promise it will always be uninterrupted or error-free.", "To the extent permitted by law, DealSphere is not liable for indirect losses arising from deals between users."],
  },
  {
    icon: IconDoorExit, title: "Ending your account",
    intro: "You can stop using DealSphere and request account deletion at any time.",
    points: ["We may suspend or close accounts that break these terms.", "Some records, such as payments, may be kept where the law or a dispute requires it."],
  },
  {
    icon: IconRefresh, title: "Changes and governing law",
    intro: "We may update these terms as the platform grows.",
    points: ["For significant changes we email you and show a notice at least 7 days before they take effect.", "Continuing to use DealSphere after that means you accept the updated terms.", "These terms are governed by the laws of Pakistan, and courts in Lahore have jurisdiction."],
  },
];

const allowed = [
  "Post real, accurate listings with your own photos",
  "Chat politely and agree on clear delivery terms",
  "Report suspicious ads, sellers or chats",
  "Review AI suggestions before publishing",
];

const notAllowed = [
  "List illegal, stolen, counterfeit or banned items",
  "Ask buyers to pay outside the platform to avoid fees",
  "Create fake accounts, reviews or duplicate ads",
  "Harass, threaten or spam other users",
];


/* ───────── page ───────── */

const TermsOfUse = () => {
  const [open, setOpen] = useState(0);

  return (
    <div className="terms-section overflow-hidden">
      <Navbar />

      <div className="container-fluid d-flex flex-wrap flex-md-nowrap align-items-center mx-lg-2 py-1 mb-2">
        <SearchBar
          type="ads"
          searchPath="/advertisement"
          wrapperClassName="col-md-5 col-lg-4 me-md-2"
        />
        <CategoryItems />
      </div>

      {/* HERO */}
      <section className="bg-light border-bottom">
        <div className="row mx-0 px-3 px-md-5 py-5 align-items-center">
          <div className="col-12 col-md-7 mb-4 mb-md-0">
            <p className="d-flex align-items-center gap-1 mb-3 small text-secondary">
              <IconHome size={15} /> Home <IconChevronRight size={13} /> Legal <IconChevronRight size={13} /> Terms of use
            </p>
            <h1 className="fw-bold mb-3 display-5">The rules for buying and selling on DealSphere</h1>
            <p className="text-secondary mb-4 col-lg-9">
              Please read these terms before you post, buy or chat. They keep the marketplace fair for everyone.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <span className="ts-chip"><IconCalendar size={15} /> Last updated: April 10, 2026</span>
              <span className="ts-chip"><IconClockHour4 size={15} /> 5 minute read</span>
            </div>
          </div>
          <div className="col-12 col-md-5 text-center text-md-end">
            <img src={termsHero} alt="Terms of use illustration" className="img-fluid rounded-3 object-fit-contain" style={{ maxHeight: '300px' }} />
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="border-bottom bg-white">
        <div className="row mx-0 px-md-5">
          {highlights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="ts-strip-item col-12 col-md-6 col-lg-3 d-flex gap-3 align-items-start p-4">
              <Icon size={26} stroke={1.5} className="flex-shrink-0" />
              <div>
                <p className="fw-semibold mb-1">{title}</p>
                <p className="small text-secondary mb-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CLAUSES + ASIDE */}
      <section className="row mx-0 px-2 px-md-5 py-5 g-4">
        <div className="col-12 col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="fw-semibold fs-4 mb-0">Terms in detail</h2>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setOpen(open === -1 ? 0 : -1)}
            >
              {open === -1 ? "Open first" : "Collapse all"}
            </button>
          </div>

          <div className="d-flex flex-column gap-2">
            {clauses.map((c, i) => {
              const isOpen = open === i;
              return (
                <div key={c.title} className={`ts-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="ts-item-btn"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="ts-num">{i + 1}</span>
                    <c.icon size={20} stroke={1.75} className="flex-shrink-0" />
                    <span className="fw-semibold">{c.title}</span>
                    <IconChevronDown size={18} className="ts-chevron" />
                  </button>
                  {isOpen && (
                    <div className="ts-item-body">
                      <p>{c.intro}</p>
                      <ul className="mb-0 ps-3">
                        {c.points.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="col-12 col-lg-4">
          <div className="ts-aside d-flex flex-column gap-3">
            <div className="border rounded-3 bg-white p-4">
              <p className="fw-semibold d-flex align-items-center gap-2 mb-3">
                <IconFileText size={20} stroke={1.75} /> In short
              </p>
              <ul className="list-unstyled small text-secondary mb-0 d-flex flex-column gap-2">
                <li>You are responsible for your account and your listings.</li>
                <li>DealSphere is a platform, so deals are between buyer and seller.</li>
                <li>Rule breakers can be warned, suspended or banned.</li>
                <li>Pakistani law applies, with courts in Lahore.</li>
              </ul>
            </div>
            <div className="border rounded-3 bg-light p-4">
              <p className="fw-semibold d-flex align-items-center gap-2 mb-2">
                <IconMail size={20} stroke={1.75} /> Questions about these terms?
              </p>
              <p className="small text-secondary mb-2">We reply within 5 business days.</p>
              <a href="mailto:legal@dealsphere.pk" className="fw-semibold text-decoration-none ts-link">
                legal@dealsphere.pk
              </a>
            </div>
          </div>
        </aside>
      </section>

      {/* DO / DON'T */}
      <section className="px-3 px-md-5 pb-5">
        <h2 className="fw-semibold fs-4 mb-4">Quick dos and don'ts</h2>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="ts-allow border rounded-3 bg-white p-4 h-100">
              <p className="fw-semibold mb-3">What we expect from you</p>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {allowed.map((t) => (
                  <li key={t} className="d-flex gap-2 align-items-start small text-secondary">
                    <IconCheck size={18} className="flex-shrink-0 mt-1" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="ts-deny border rounded-3 bg-white p-4 h-100">
              <p className="fw-semibold mb-3">What can get you removed</p>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {notAllowed.map((t) => (
                  <li key={t} className="d-flex gap-2 align-items-start small text-secondary">
                    <IconX size={18} className="flex-shrink-0 mt-1" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ts-cta mb-5">
        <div className="row mx-0 px-3 px-md-5 py-5 align-items-center">
          <div className="col-12 col-md-8 mb-4 mb-md-0">
            <p className="d-flex align-items-center gap-2 text-white-50 mb-2">
              <IconHeadset size={20} /> Need a hand?
            </p>
            <h2 className="fw-semibold fs-3 mb-2">Something unclear or something wrong?</h2>
            <p className="text-white-50 mb-4 col-lg-9">
              Report a scam, ask about a suspension, or check how a rule applies to you. Our team is here to help.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link to='/contact/submit' className="btn btn-light fw-medium">Contact legal team</Link>
              <div className="btn btn-outline-light d-inline-flex align-items-center gap-2">
                <IconAlertTriangle size={18} /> Report abuse
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4 text-center text-md-end">
            <img src={termsSupport} alt="Support team" className="img-fluid rounded-3 object-fit-contain" style={{ maxHeight: '200px'}} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfUse;