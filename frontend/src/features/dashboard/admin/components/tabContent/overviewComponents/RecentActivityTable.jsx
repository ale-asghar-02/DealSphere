import React, { useState } from "react";

const ACTIVITY_TYPES = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "users", label: "Users" },
  { key: "ads", label: "Ads" },
  { key: "products", label: "Products" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "reports", label: "Reports" },
  { key: "contacts", label: "Contacts" },
  { key: "transactions", label: "Transactions" },
  { key: "featured", label: "Featured" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "designSubscriptions", label: "Design Plans" },
];

const TYPE_STYLES = {
  orders:              { label: "Order",        bg: "#dbeafe", color: "#1d4ed8" },
  users:               { label: "User",         bg: "#e0f2fe", color: "#0369a1" },
  ads:                 { label: "Ad",           bg: "#fff7ed", color: "#c2410c" },
  products:            { label: "Product",      bg: "#f3e8ff", color: "#7e22ce" },
  withdrawals:         { label: "Withdrawal",   bg: "#fef2f2", color: "#b91c1c" },
  reports:             { label: "Report",       bg: "#fee2e2", color: "#dc2626" },
  contacts:            { label: "Contact",      bg: "#f3f4f6", color: "#4b5563" },
  transactions:        { label: "Transaction",  bg: "#ecfeff", color: "#0e7490" },
  featured:            { label: "Featured",     bg: "#fff7ed", color: "#c2410c" },
  subscriptions:       { label: "Subscription", bg: "#fdf4ff", color: "#9333ea" },
  designSubscriptions: { label: "Design Plan",  bg: "#fdf2f8", color: "#be185d" },
};

const STATUS_STYLES = {
  pending: { bg: "#fef9c3", color: "#a16207" },
  confirmed: { bg: "#dbeafe", color: "#1d4ed8" },
  shipped: { bg: "#e0f2fe", color: "#0369a1" },
  delivered: { bg: "#dcfce7", color: "#166534" },
  cancelled: { bg: "#fee2e2", color: "#b91c1c" },
  completed: { bg: "#dcfce7", color: "#166534" },
  active: { bg: "#dcfce7", color: "#166534" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
  resolved: { bg: "#dcfce7", color: "#166534" },
  paid: { bg: "#dcfce7", color: "#166534" },
  refunded: { bg: "#f3e8ff", color: "#7e22ce" },
  failed: { bg: "#fee2e2", color: "#b91c1c" },
  seller: { bg: "#f3e8ff", color: "#7e22ce" },
  buyer: { bg: "#dbeafe", color: "#1d4ed8" },
};

const timeAgo = (date) => {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Badge = ({ bg, color, children }) => (
  <span
    className="d-inline-block px-2 py-1 rounded-pill small fw-medium text-capitalize"
    style={{ background: bg, color, fontSize: ".68rem", whiteSpace: "nowrap" }}
  >
    {children}
  </span>
);

// single unified table — every row already comes from the backend in the same shape:
// { type, id, desc, user, amount, status, createdAt }
const ActivityTable = ({ data }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["#", "Type", "Description", "User / Seller", "Amount", "Status", "Time"].map((h) => (
            <th
              key={h}
              style={{
                fontSize: ".7rem",
                fontWeight: 600,
                color: "#6b7280",
                padding: "0 10px 10px",
                textAlign: "left",
                borderBottom: "1px solid #e5e7eb",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: ".82rem" }}>
              No recent activity
            </td>
          </tr>
        ) : (
          data.map((row, i) => {
            const tc = TYPE_STYLES[row.type] || { label: row.type, bg: "#f3f4f6", color: "#6b7280" };
            const sc = STATUS_STYLES[String(row.status).toLowerCase()] || { bg: "#f3f4f6", color: "#6b7280" };
            return (
              <tr
                key={row._id || i}
                style={{ borderBottom: "1px solid #f3f4f6", transition: "background .12s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ fontSize: ".7rem", color: "#9ca3af", padding: "11px 10px" }}>{i + 1}</td>

                <td style={{ padding: "11px 10px" }}>
                  <Badge bg={tc.bg} color={tc.color}>{tc.label}</Badge>
                </td>

                <td style={{ padding: "11px 10px", maxWidth: 280 }}>
                  <div
                    style={
                      row.type === "reports"
                        ? {
                            fontSize: ".76rem",
                            fontWeight: 500,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }
                        : { fontSize: ".76rem", fontWeight: 500 }
                    }
                  >
                    {row.desc}
                  </div>
                </td>

                <td style={{ fontSize: ".76rem", padding: "11px 10px", whiteSpace: "nowrap" }}>{row.user}</td>

                <td style={{ padding: "11px 10px" }}>
                  {row.amount != null ? (
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: ".78rem",
                        color: row.status === "cancelled" ? "#dc2626" : "#111827",
                      }}
                    >
                      Rs. {Number(row.amount).toLocaleString()}
                    </span>
                  ) : (
                    <span style={{ color: "#d1d5db", fontSize: ".72rem" }}>—</span>
                  )}
                </td>

                <td style={{ padding: "11px 10px" }}>
                  <Badge bg={sc.bg} color={sc.color}>{row.status || "—"}</Badge>
                </td>

                <td style={{ fontSize: ".72rem", color: "#9ca3af", padding: "11px 10px", whiteSpace: "nowrap" }}>
                  {timeAgo(row.createdAt)}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

const ActivityTabs = ({ activeType, onTypeChange }) => (
  <ul className="nav nav-pills mb-3 flex-wrap gap-1">
    {ACTIVITY_TYPES.map((t) => (
      <li className="nav-item" key={t.key}>
        <button
          className={`nav-link py-1 px-3 small ${activeType === t.key ? "active bg-dark" : "text-dark"}`}
          onClick={() => onTypeChange(t.key)}
        >
          {t.label}
        </button>
      </li>
    ))}
  </ul>
);

// hides the scrollbar visually while keeping the element scrollable (wheel/touch/drag all still work)
const NoScrollbarStyle = () => (
  <style>{`
    .adm-no-scrollbar {
      scrollbar-width: none;      /* Firefox */
      -ms-overflow-style: none;   /* IE/Edge legacy */
    }
    .adm-no-scrollbar::-webkit-scrollbar {
      display: none;              /* Chrome/Safari/Edge */
    }
  `}</style>
);

const RecentActivityTable = ({ activeType, onTypeChange, data, statsLoading }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <div style={{ background: "#fff", border: "1px solid #eef0f2", borderRadius: 16, padding: "20px 22px" }}>
      <NoScrollbarStyle />
      <div className="d-flex align-items-center justify-content-between mb-3" style={{ flexWrap: "wrap", gap: 8 }}>
        <h6 className="fw-semibold mb-0" style={{ fontSize: ".95rem" }}>Recent Activity</h6>
        <button className="btn btn-outline-dark btn-sm" onClick={() => setIsFullScreen(true)}>
          View Full Screen
        </button>
      </div>

      {/* default (non-fullscreen) dashboard view only: capped at 100vh, scrolls if content is taller, scrollbar hidden */}
      <div className="adm-no-scrollbar" style={{ maxHeight: "100vh", overflowY: "auto" }}>
        {statsLoading ? (
          <p className="text-muted small">Loading...</p>
        ) : (
          <ActivityTable data={data} />
        )}
      </div>

      {isFullScreen && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-fullscreen">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Recent Activity</h5>
                  <button type="button" className="btn-close" onClick={() => setIsFullScreen(false)}></button>
                </div>
                <div className="modal-body">
                  {/* fullscreen: admin can pick any type (or All) */}
                  <ActivityTabs activeType={activeType} onTypeChange={onTypeChange} />
                  {statsLoading ? (
                    <p className="text-muted small">Loading...</p>
                  ) : (
                    <ActivityTable data={data} />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default RecentActivityTable;