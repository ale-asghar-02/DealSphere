import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";

import SearchBar from "@/features/search/components/SearchBar";
import CategoryItems from "@/features/category/pages/CategoryItems";

import useArticle from "../hooks/useArticle";

import { IconSearch, IconX, IconChevronDown, IconEye, IconArrowUpRight, IconThumbUp, IconThumbDown, IconMail, IconPhone, IconSearchOff, IconHeadset } from "@tabler/icons-react";

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 6;
const SUPPORT_PHONE = "+92 313 972 2059";
 
const CATEGORY_BADGE_STYLES = {
  buying: { backgroundColor: "#e0f2fe", color: "#0284c7" },
  selling: { backgroundColor: "#dcfce7", color: "#15803d" },
  account: { backgroundColor: "#fef9c3", color: "#ca8a04" },
  safety: { backgroundColor: "#fee2e2", color: "#dc2626" },
  orders: { backgroundColor: "#ede9fe", color: "#7c3aed" },
  payments: { backgroundColor: "#ffedd5", color: "#ea580c" },
};
const DEFAULT_BADGE_STYLE = { backgroundColor: "#f3f4f6", color: "#555" };
const getBadgeStyle = (slug) => CATEGORY_BADGE_STYLES[slug] || DEFAULT_BADGE_STYLE;
 
const QUICK_SEARCH_PILLS = [
  "Post an ad",
  "Report a scam",
  "Boost listing",
  "Delete account",
  "Verify account",
  "Contact seller",
];
 
const FAQS = [
  {
    q: "Is DealSphere free to use?",
    a: "Basic listings are 100% free. Optional paid packages are available to boost your ad visibility and reach more buyers.",
  },
  {
    q: "Can I list both a product and an ad on the same account?",
    a: "Yes. DealSphere supports both product listings (buy/sell) and classified ads on the same account.",
  },
  {
    q: "How do I post an ad or product listing?",
    a: 'Click "Post Ad" in the navbar, choose your category — product or classified ad — add photos, price, and description, then publish.',
  },
  {
    q: "Can I edit my listing after posting?",
    a: 'Yes. Go to "My Listings" in your profile, select the listing, and click Edit. Changes appear immediately.',
  },
  {
    q: "How does DealSphere handle scam reports?",
    a: "Our Trust & Safety team reviews every report within 24 hours. Confirmed scammers are permanently banned.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Account Settings → Privacy → Delete Account. This permanently removes your profile and all listings.",
  },
];
 
const formatCategory = (slug) => (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "");
 
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
 
// ── FAQ ITEM ───────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
 
  return (
    <div className="border rounded-3 overflow-hidden mb-2 bg-white">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-100 text-start border-0 d-flex justify-content-between align-items-center gap-3 px-3 py-3 bg-transparent"
        style={{ cursor: "pointer" }}
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
 
// ── ARTICLE MODAL ──────────────────────────────────────────────────────────
function ArticleModal({ article, onClose, onVote }) {
  if (!article) return null;
 
  const categorySlug = article.category || "";
  const badgeStyle = getBadgeStyle(categorySlug);
 
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 1050, backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-4 d-flex flex-column overflow-hidden w-100"
        style={{ maxWidth: 640, maxHeight: "88vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-bottom flex-shrink-0">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div className="flex-grow-1">
              <span className="rounded-pill px-2 py-1 d-inline-block mb-2 fw-semibold" style={{ fontSize: 11, ...badgeStyle }}>
                {formatCategory(categorySlug)}
              </span>
              <h5 className="fw-semibold text-dark mb-1" style={{ fontSize: 17, letterSpacing: "-0.02em" }}>
                {article.title}
              </h5>
              <div className="d-flex align-items-center gap-3 text-secondary" style={{ fontSize: 12 }}>
                <span className="d-inline-flex align-items-center gap-1">
                  <IconEye size={14} /> {article.views} views
                </span>
                <span>·</span>
                <span>Updated {formatDate(article.updatedAt)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="btn btn-sm border-0 d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-light text-secondary"
              style={{ width: 32, height: 32 }}
            >
              <IconX size={16} />
            </button>
          </div>
        </div>
 
        {/* Body */}
        <div className="px-4 py-3 flex-grow-1 overflow-auto">
          <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {article.content}
          </p>
          {article.tags?.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-pill px-2 py-1 bg-light fw-semibold" style={{ fontSize: 11, color: "#4b5563" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
 
        {/* Footer */}
        <div className="px-4 py-3 border-top bg-light flex-shrink-0">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div>
              <p className="mb-0 text-secondary" style={{ fontSize: 12 }}>
                Was this article helpful?
              </p>
              <p className="mb-0 text-muted d-flex align-items-center gap-3" style={{ fontSize: 11 }}>
                <span className="d-inline-flex align-items-center gap-1">
                  <IconThumbUp size={12} /> {article.helpful?.yes || 0}
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                  <IconThumbDown size={12} /> {article.helpful?.no || 0}
                </span>
              </p>
            </div>
            <div className="d-flex gap-2">
              <button onClick={() => onVote(article.slug, "yes")} className="btn btn-sm border fw-semibold rounded-2 d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                <IconThumbUp size={14} /> Yes
              </button>
              <button onClick={() => onVote(article.slug, "no")} className="btn btn-sm border fw-semibold rounded-2 d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                <IconThumbDown size={14} /> No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ── MAIN PAGE ──────────────────────────────────────────────────────────────
const HelpCenter = () => {
  const {
    articleLoading,
    articles,
    article,
    handleGetArticles,
    handleSearchArticles,
    handleGetArticleBySlug,
    handleVoteArticleHelpful,
  } = useArticle();
 
  const [helpQuery, setHelpQuery] = useState("");
  const [debouncedHelpQuery, setDebouncedHelpQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedArticle, setSelectedArticle] = useState(null);
 
  const articlesRef = useRef(null);
 
  // Keep the modal in sync whenever the hook's single-article state updates (e.g. after a vote)
  useEffect(() => {
    if (article) setSelectedArticle(article);
  }, [article]);
 
  // Debounce the help-articles search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHelpQuery(helpQuery), 400);
    return () => clearTimeout(timer);
  }, [helpQuery]);
 
  // Load popular articles by default, or search results once the query is long enough
  useEffect(() => {
    if (debouncedHelpQuery.trim().length >= 2) {
      handleSearchArticles(debouncedHelpQuery.trim());
    } else {
      handleGetArticles();
    }
    setVisibleCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedHelpQuery]);
 
  const scrollToArticles = useCallback(() => {
    setTimeout(() => {
      articlesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }, []);
 
  const handleQuickPillClick = (pill) => {
    setHelpQuery(pill);
    setDebouncedHelpQuery(pill); // search immediately instead of waiting for the debounce
    scrollToArticles();
  };
 
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && helpQuery.trim().length >= 2) scrollToArticles();
  };
 
  const clearSearch = () => setHelpQuery("");
 
  const openArticle = useCallback(
    (item) => {
      handleGetArticleBySlug(item.slug);
    },
    [handleGetArticleBySlug]
  );
 
  // Only treat it as a "loading" screen on the first load, so the list doesn't flash
  // to skeletons every time an article is opened or voted on.
  const initialLoading = articleLoading && articles.length === 0;
 
  const heading = debouncedHelpQuery ? `Results for "${debouncedHelpQuery}"` : "Popular articles";
 
  const visibleArticles = useMemo(() => articles.slice(0, visibleCount), [articles, visibleCount]);
  const hasMore = visibleCount < articles.length;
  const canShowLess = visibleCount > PAGE_SIZE;
 
  return (
    <div className="overflow-hidden">
      <Navbar />
 
      <div className="container-fluid d-flex flex-wrap flex-md-nowrap align-items-center mx-lg-2 py-1 mb-2">
        <SearchBar type="ads" searchPath="/advertisement" wrapperClassName="col-md-5 col-lg-4 me-md-2" />
        <CategoryItems />
      </div>
 
      {/* ── HELP CENTER ── */}
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} onVote={handleVoteArticleHelpful} />
 
      <div className="container px-2 px-md-5 py-4 mb-5 mx-auto">
        {/* Article search */}
        <div className="text-center py-4 mx-auto mb-4" style={{ maxWidth: 640 }}>
          <h1 className="fw-bold mb-2 text-dark" style={{ fontSize: "clamp(24px,4vw,36px)", letterSpacing: "-0.03em" }}>
            How can we help you?
          </h1>
          <p className="mb-4 text-secondary" style={{ fontSize: 15 }}>
            Search help articles and guides for DealSphere
          </p>
 
          <div className="position-relative mx-auto" style={{ maxWidth: 520 }}>
            <div className="position-absolute top-50 translate-middle-y" style={{ left: 18, pointerEvents: "none" }}>
              <IconSearch size={16} color="#94a3b8" />
            </div>
            <input
              type="text"
              className="form-control border rounded-3 py-3"
              style={{ paddingLeft: 52, paddingRight: helpQuery ? 44 : 16, fontSize: 14 }}
              placeholder="Search for help… e.g. how to post an ad"
              value={helpQuery}
              onChange={(e) => setHelpQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {helpQuery && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="btn btn-sm border-0 position-absolute top-50 translate-middle-y d-flex align-items-center justify-content-center rounded-circle bg-light text-secondary"
                style={{ right: 12, width: 24, height: 24, padding: 0 }}
              >
                <IconX size={12} />
              </button>
            )}
          </div>
 
          {/* Quick search pills */}
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
            {QUICK_SEARCH_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => handleQuickPillClick(pill)}
                className="btn btn-sm rounded-pill border bg-white text-secondary"
                style={{ fontSize: 12 }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
 
        {/* Articles */}
        <h5 ref={articlesRef} className="fw-semibold text-dark mb-1" style={{ letterSpacing: "-0.02em" }}>
          {heading}
        </h5>
        <p className="text-secondary mb-4" style={{ fontSize: 13 }}>
          {initialLoading ? "Loading..." : `${articles.length} article${articles.length !== 1 ? "s" : ""} found`}
        </p>
 
        <div className="d-flex flex-column gap-2 mb-3">
          {initialLoading ? (
            [1, 2, 3, 4].map((i) => <div key={i} className="border rounded-3 bg-light" style={{ height: 58 }} />)
          ) : articles.length > 0 ? (
            visibleArticles.map((item, idx) => {
              const categorySlug = item.category || "";
              const badgeStyle = getBadgeStyle(categorySlug);
              return (
                <button
                  key={item._id}
                  onClick={() => openArticle(item)}
                  className="d-flex flex-wrap align-items-center gap-3 border rounded-3 px-3 py-3 w-100 text-start bg-white"
                  style={{ cursor: "pointer", transition: "all 0.15s", color: "inherit" }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 bg-light text-secondary fw-semibold"
                    style={{ width: 30, height: 30, fontSize: 11 }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <span className="fw-medium text-dark flex-grow-1" style={{ fontSize: 14 }}>
                    {item.title}
                  </span>
                  <div className="d-flex align-items-center gap-3">
                    <span className="rounded-pill px-2 py-1 flex-shrink-0 fw-bold" style={{ fontSize: 10, ...badgeStyle }}>
                      {formatCategory(categorySlug)}
                    </span>
                    <span className="d-inline-flex align-items-center gap-1 flex-shrink-0 text-muted" style={{ fontSize: 12 }}>
                      <IconEye size={14} /> {item.views}
                    </span>
                    <span className="text-muted flex-shrink-0 d-inline-flex">
                      <IconArrowUpRight size={16} />
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="border rounded-3 px-4 py-5 text-center bg-white" style={{ borderStyle: "dashed" }}>
              <IconSearchOff size={48} stroke={1.5} className="text-secondary mb-3" />
              <p className="text-secondary mb-0" style={{ fontSize: 14 }}>
                No articles found. Try a different keyword.
              </p>
            </div>
          )}
        </div>
 
        {/* Show More / Show Less */}
        {!initialLoading && articles.length > PAGE_SIZE && (
          <div className="d-flex align-items-center gap-2 mb-5">
            {canShowLess && (
              <button
                onClick={() => setVisibleCount((v) => Math.max(PAGE_SIZE, v - PAGE_SIZE))}
                className="btn btn-sm border fw-semibold rounded-pill px-3 py-2 bg-white text-dark"
                style={{ fontSize: 13 }}
              >
                Show Less
              </button>
            )}
            {hasMore && (
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="btn btn-sm fw-semibold rounded-pill px-3 py-2 btn-dark border-0"
                style={{ fontSize: 13 }}
              >
                Show More &nbsp;
                <span className="fw-medium opacity-75" style={{ fontSize: 11 }}>
                  ({articles.length - visibleCount} remaining)
                </span>
              </button>
            )}
          </div>
        )}
 
        {/* FAQ */}
        <h5 className="fw-semibold text-dark mb-1" style={{ letterSpacing: "-0.02em" }}>
          Frequently asked questions
        </h5>
        <p className="text-secondary mb-4" style={{ fontSize: 13 }}>
          Quick answers to common queries
        </p>
        <div className="col-12 col-lg-8 mb-5 pb-5 px-0">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
 
        {/* Still need help — static contact info, no form/modal */}
        <div
          className="row align-items-center rounded-4 p-4 g-4 position-relative overflow-hidden mx-0"
          style={{ backgroundColor: "#0f172a" }} >

          {/* grid overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="col-12 col-md-3 text-center position-relative">
           <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle text-white"
              style={{ width: 96, height: 96, backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <IconHeadset size={44} stroke={1.5} />
            </div>
          </div>

          <div className="col-12 col-md-9 position-relative">
            <h5 className="fw-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
              Still need help?
            </h5>
            <p className="mb-3" style={{ fontSize: 13, color: "#94a3b8" }}>
              Support team available 7 days a week, 9am – 9pm PKT
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link
                to="/contact/submit"
                className="btn btn-outline-light rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2"
                style={{ fontSize: 13 }}
              >
                <IconMail size={16} /> Send Mail
              </Link>
              <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`} className="btn btn-light rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 border-0" style={{ fontSize: 13 }}>
                <IconPhone size={16} /> {SUPPORT_PHONE}
              </a>
            </div>
          </div>
        </div>

      </div>
 
      <div className="row">
        <Footer />
      </div>
    </div>
  );
};
 
export default HelpCenter;