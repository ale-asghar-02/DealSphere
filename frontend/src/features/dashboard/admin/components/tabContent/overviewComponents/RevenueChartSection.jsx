import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PERIODS = ["monthly", "weekly", "daily"];
const PERIOD_LABEL = { monthly: "Monthly", weekly: "Weekly", daily: "Daily" };

const SERIES = [
  { key: "orderRevenue", name: "Orders", color: "#2563eb" },
  { key: "subscriptionRevenue", name: "Subscriptions", color: "#9333ea" },
  { key: "featureRevenue", name: "Featured Ads", color: "#f97316" },
  { key: "designRevenue", name: "Design Plans", color: "#ec4899" },
  { key: "commissionRevenue", name: "Commission", color: "#16a34a" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#111827",
        color: "#fff",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: ".75rem",
        boxShadow: "0 8px 24px rgba(0,0,0,.18)",
      }}
    >
      <p className="fw-semibold mb-2" style={{ opacity: 0.85 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="d-flex align-items-center gap-2 mb-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ opacity: 0.75 }}>{p.name}:</span>
          <span className="fw-medium">Rs. {Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const RevenueChartSection = ({ data, period, onPeriodChange, statsLoading }) => {
  const totals = data.reduce(
    (acc, d) => ({
      soldTotal: acc.soldTotal + (d.soldTotal || 0),
      commissionRevenue: acc.commissionRevenue + (d.commissionRevenue || 0),
      totalRevenue: acc.totalRevenue + (d.totalRevenue || 0),
    }),
    { soldTotal: 0, commissionRevenue: 0, totalRevenue: 0 }
  );

  return (
    <div
      className="mb-4"
      style={{ background: "#fff", border: "1px solid #eef0f2", borderRadius: 16, padding: "20px 22px" }}
    >
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h6 className="mb-0 fw-semibold">Revenue Overview</h6>
          <small className="text-muted">Everything sold + platform commission — live</small>
        </div>
        <ul className="nav nav-pills gap-1 mb-0">
          {PERIODS.map((p) => (
            <li className="nav-item" key={p}>
              <button
                className={`nav-link py-1 px-3 small ${period === p ? "active bg-dark" : "text-dark"}`}
                onClick={() => onPeriodChange(p)}
              >
                {PERIOD_LABEL[p]}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-6 col-md-4">
          <div className="rounded-3 p-3" style={{ background: "linear-gradient(135deg,#eef2ff,#f5f7ff)" }}>
            <div className="fw-bold fs-6" style={{ color: "#3730a3" }}>Rs. {totals.soldTotal.toLocaleString()}</div>
            <div className="text-muted small">Total Sold (Orders + Subs + Ads + Design)</div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="rounded-3 p-3" style={{ background: "linear-gradient(135deg,#f0fdf4,#f6fffa)" }}>
            <div className="fw-bold fs-6" style={{ color: "#15803d" }}>Rs. {totals.commissionRevenue.toLocaleString()}</div>
            <div className="text-muted small">Platform Commission</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="rounded-3 p-3" style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}>
            <div className="fw-bold fs-6 text-white">Rs. {totals.totalRevenue.toLocaleString()}</div>
            <div className="small" style={{ color: "#9ca3af" }}>Grand Total</div>
          </div>
        </div>
      </div>

      {statsLoading ? (
        <p className="text-muted small">Loading...</p>
      ) : data.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <small>No data for this period</small>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barGap={3} barCategoryGap="28%">
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.55} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,.03)" }} />
            {SERIES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={`url(#grad-${s.key})`}
                radius={[6, 6, 0, 0]}
                maxBarSize={18}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="d-flex flex-wrap gap-3 mt-2">
        {SERIES.map((s) => (
          <div key={s.key} className="d-flex align-items-center gap-2">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
            <span className="small text-muted">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChartSection;