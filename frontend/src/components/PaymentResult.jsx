import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { IconCircleCheck, IconCircleX, IconClockHour4, IconAlertTriangle } from "@tabler/icons-react";
import Navbar from "@/components/Navbar/Navbar";
import useUser from "@/hooks/useUser";
import useOrder from "@/features/order/hooks/useOrder";
import { fetchSubscription } from "@/features/subscription/store/SubscriptionStore";
import { useCartContext } from "@/features/cart/CartContext";

const MAX_CHECKS = 5;
const CHECK_EVERY_MS = 2000;
const DASHBOARD_URL = "/user/dashboard";

// Har flow ka apna message aur buttons. Naya flow aaye to sirf yahan entry add karni hai.
const FLOW_CONFIG = {
  order: {
    successTitle: "Order placed successfully",
    successMessage: "Your payment was received and your order is being processed.",
    successCta: { label: "View my orders", to: DASHBOARD_URL, state: { tab: "order-tab" } },
    cancelMessage: "No money was taken. Your order was not completed.",
    retryCta: { label: "Continue shopping", to: "/products" },
  },
  featured: {
    successTitle: "Your listing is now featured",
    successMessage: "Your payment was received. Featuring will be active in a few moments.",
    successCta: { label: "Go to featured", to: DASHBOARD_URL, state: { tab: "post-tab" } },
    cancelMessage: "No money was taken. Your listing was not featured.",
    retryCta: { label: "Back to dashboard", to: DASHBOARD_URL },
  },
  subscription: {
    successTitle: "Subscription activated",
    successMessage: "Your payment was received and your seller plan is being activated.",
    successCta: { label: "Go to plan", to: DASHBOARD_URL, state: { tab: "subscription-tab" } },
    cancelMessage: "No money was taken. Your plan was not activated.",
    retryCta: { label: "Back to plans", to: "/upgrade-plan" },
  },
  design_subscription: {
    successTitle: "Design Studio plan activated",
    successMessage: "Your payment was received. Enjoy designs without a watermark.",
    successCta: { label: "Start designing", to: "/design" },
    cancelMessage: "No money was taken. You can try again whenever you are ready.",
    retryCta: { label: "Back to plans", to: "/design/pricing" },
  },
};

const DEFAULT_CONFIG = {
  successTitle: "Payment successful",
  successMessage: "Your payment was received.",
  successCta: { label: "Go to home", to: "/" },
  cancelMessage: "No money was taken.",
  retryCta: { label: "Go to home", to: "/" },
};

const btnStyle = { paddingBlock: "12px" };

const formatPkr = (value) => (value == null ? "-" : `Rs ${Number(value).toLocaleString("en-PK")}`);
const formatUsd = (value) => (value == null ? "-" : `$${Number(value).toFixed(2)}`);
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
const capitalize = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);

const Row = ({ label, children }) => (
  <div className="d-flex justify-content-between align-items-start gap-3 py-2 border-bottom">
    <span className="text-muted">{label}</span>
    <span className="fw-medium text-end" style={{ wordBreak: "break-all" }}>
      {children}
    </span>
  </div>
);

// Payment ki receipt (title, tags, items, price, method, date, reference)
const PaymentDetails = ({ details }) => {
  if (!details) return null;

  const {
    title,
    tags = [],
    items = [],
    amountPkr,
    amountUsd,
    paymentMethod,
    paymentMethodLabel,
    statusLabel,
    paidAt,
    reference,
    email,
  } = details;

  return (
    <div className="border rounded-3 text-start p-3 mb-4">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <h6 className="fw-semibold mb-0 me-1">{title}</h6>
        <span className={`badge fw-medium rounded-1 ${statusLabel ? "bg-warning text-dark" : "bg-success"}`}>
          {statusLabel || "Paid"}
        </span>
        {tags.map((tag) => (
          <span key={tag} className="badge fw-medium rounded-1 bg-light text-dark border">
            {tag}
          </span>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mb-2">
          {items.map((item, index) => (
            <div key={index} className="d-flex align-items-center gap-2 py-2 border-bottom">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  width={44}
                  height={44}
                  className="rounded"
                  style={{ objectFit: "cover" }}
                />
              )}
              <div className="flex-grow-1">
                <div className="fw-medium">{item.title}</div>
                <small className="text-muted">
                  {item.quantity} x {formatPkr(item.price)}
                </small>
              </div>
              <div className="fw-medium">{formatPkr(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
      )}

      {items.length === 1 && (
        <div className="d-flex align-items-center gap-2 py-2 border-bottom">
          {items[0].image && (
            <img
              src={items[0].image}
              alt={items[0].title}
              width={44}
              height={44}
              className="rounded"
              style={{ objectFit: "cover" }}
            />
          )}
          <small className="text-muted">
            Quantity: {items[0].quantity} x {formatPkr(items[0].price)}
          </small>
        </div>
      )}

      <Row label="Amount">{formatPkr(amountPkr)}</Row>
      {amountUsd != null && <Row label="Charged (USD)">{formatUsd(amountUsd)}</Row>}
      <Row label="Payment method">
        {paymentMethodLabel || (paymentMethod ? `${capitalize(paymentMethod.brand)} •••• ${paymentMethod.last4}` : "Card")}
      </Row>
      <Row label="Date">{formatDateTime(paidAt)}</Row>
      {email && <Row label="Email">{email}</Row>}
      <Row label="Reference">{reference}</Row>
    </div>
  );
};

// /payment/success aur /payment/cancelled dono routes isi ek page ko dikhate hain
const PaymentResult = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isSuccess = pathname.includes("success");

  const { handleGetCart } = useCartContext();

  const flow = searchParams.get("flow");
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("orderId");
  const isCod = searchParams.get("method") === "cod"; // COD me Stripe session nahi hota
  const config = FLOW_CONFIG[flow] || DEFAULT_CONFIG;

  const { handleVerifySession } = useUser();
  const { handleVerifyCodOrder, handleAbandonOrder } = useOrder();

  // checking | paid | pending | unknown | cancelled
  const [state, setState] = useState(isSuccess ? "checking" : "cancelled");
  const [details, setDetails] = useState(null);

  // Cancel page khulte hi unpaid Stripe order band karo (sirf order flow mein).
  // Backend sirf unpaid Stripe order par kaam karta hai, paid order ko nahi chhuta.
  // ref isliye ke React StrictMode mein effect do baar chalta hai.
  const abandonedRef = useRef(false);

  useEffect(() => {
    if (isSuccess || flow !== "order" || !orderId || abandonedRef.current) return;
    abandonedRef.current = true;
    handleAbandonOrder(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSuccess) return;

    // Cash on Delivery: orderId se order fetch karke receipt dikhao
    if (isCod) {
      if (!orderId) {
        setState("unknown");
        return;
      }
      let stopped = false;
      (async () => {
        const data = await handleVerifyCodOrder(orderId);
        if (stopped) return;
        if (!data) {
          setState("unknown");
          return;
        }
        setDetails(data.details || null);
        setState("paid");
      })();
      return () => {
        stopped = true;
      };
    }

    if (!sessionId) {
      setState("unknown");
      return;
    }

    let cancelled = false;
    let timer;
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      const data = await handleVerifySession(sessionId);
      if (cancelled) return;

      if (!data) {
        setState("unknown");
        return;
      }
      if (data.paymentStatus === "paid") {
        setDetails(data.details || null);
        setState("paid");
        return;
      }
      if (data.status === "expired") {
        setState("cancelled");
        return;
      }
      if (attempts >= MAX_CHECKS) {
        setState("pending");
        return;
      }
      timer = setTimeout(check, CHECK_EVERY_MS);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, sessionId, isCod, orderId]);

  // subscription / featured: subscription refresh
  useEffect(() => {
    if (state !== "paid" || (flow !== "subscription" && flow !== "featured")) return;

    fetchSubscription();
    const t1 = setTimeout(fetchSubscription, 3000);
    const t2 = setTimeout(fetchSubscription, 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [state, flow]);

  // order: cart refresh (COD aur card dono, purani items hat jayein)
  useEffect(() => {
    if (state !== "paid" || flow !== "order") return;

    handleGetCart();
    const t1 = setTimeout(handleGetCart, 3000);
    const t2 = setTimeout(handleGetCart, 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, flow]);

  return (
    <div>
      <Navbar />

      <div className="container py-5" style={{ maxWidth: 560, marginBottom: "100px" }}>
        <div className="border rounded-3 bg-white text-center py-5 px-3">
          {state === "checking" && (
            <>
              <div className="spinner-border text-primary mb-3" role="status"></div>
              <h4 className="fw-semibold mb-1">Confirming your payment...</h4>
              <p className="text-muted mb-0">This takes a few seconds. Please do not close this page.</p>
            </>
          )}

          {state === "paid" && (
            <>
              <IconCircleCheck size={64} className="text-success mb-3" />
              <h4 className="fw-semibold mb-1">{config.successTitle}</h4>
              <p className="text-muted mb-4">
                {isCod ? "Your order has been placed. You will pay in cash when it is delivered." : config.successMessage}
              </p>

              <PaymentDetails details={details} />

              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Link to={config.successCta.to} state={config.successCta.state} className="btn btn-primary rounded-2 px-4" style={btnStyle}>
                  {config.successCta.label}
                </Link>
                <Link to="/" className="btn btn-outline-secondary rounded-2 px-4" style={btnStyle}>
                  Go to home
                </Link>
              </div>
            </>
          )}

          {state === "pending" && (
            <>
              <IconClockHour4 size={64} className="text-warning mb-3" />
              <h4 className="fw-semibold mb-1">Payment is still processing</h4>
              <p className="text-muted mb-4">
                It is taking longer than usual. We will send you a notification as soon as it is confirmed.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Link to={config.successCta.to} state={config.successCta.state} className="btn btn-primary rounded-2 px-4" style={btnStyle}>
                  {config.successCta.label}
                </Link>
                <Link to="/" className="btn btn-outline-secondary rounded-2 px-4" style={btnStyle}>
                  Go to home
                </Link>
              </div>
            </>
          )}

          {state === "unknown" && (
            <>
              <IconAlertTriangle size={64} className="text-warning mb-3" />
              <h4 className="fw-semibold mb-1">We could not confirm your payment</h4>
              <p className="text-muted mb-4">
                If money was deducted, it will be confirmed shortly and you will get a notification. Otherwise you can try again.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Link to={config.retryCta.to} className="btn btn-primary rounded-2 px-4" style={btnStyle}>
                  {config.retryCta.label}
                </Link>
                <Link to="/" className="btn btn-outline-secondary rounded-2 px-4" style={btnStyle}>
                  Go to home
                </Link>
              </div>
            </>
          )}

          {state === "cancelled" && (
            <>
              <IconCircleX size={64} className="text-danger mb-3" />
              <h4 className="fw-semibold mb-1">Payment cancelled</h4>
              <p className="text-muted mb-4">{config.cancelMessage}</p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Link to={config.retryCta.to} className="btn btn-primary rounded-2 px-4" style={btnStyle}>
                  {config.retryCta.label}
                </Link>
                <Link to="/" className="btn btn-outline-secondary rounded-2 px-4" style={btnStyle}>
                  Go to home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;