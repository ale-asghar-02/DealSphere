import React, { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { IconUsers, IconUserCheck, IconAd2, IconBox, IconShoppingCart, IconCurrencyDollar, IconCrown, IconCashBanknote, IconFlag, IconPalette, IconSparkles, IconClockExclamation, IconWand } from "@tabler/icons-react";

import useAdminStats from '../../hooks/useAdminStats';
import StatCard from "./overviewComponents/StatCard";
import RecentActivityTable from "./overviewComponents/RecentActivityTable";
import RevenueChartSection from "./overviewComponents/RevenueChartSection";

const PIE_COLORS = ["#2563eb", "#9333ea", "#f97316", "#16a34a"];

const cardBox = { background: "#fff", border: "1px solid #eef0f2", borderRadius: 16, padding: "18px 20px" };

const AdminStatsOverview = () => {
  const {
    statsLoading,
    overview,
    usersGrowth,
    ordersRevenue,
    listingsGrowth,
    subscriptionDistribution,
    designOverview,
    recentActivity,
    revenueChart,
    fetchOverview,
    fetchUsersGrowth,
    fetchOrdersRevenue,
    fetchListingsGrowth,
    fetchCategoryDistribution,
    fetchSubscriptionDistribution,
    fetchDesignOverview,
    fetchRecentActivity,
    fetchRevenueChart,
  } = useAdminStats();

  const [range, setRange] = useState("30d");
  const [activityType, setActivityType] = useState("all");
  const [chartPeriod, setChartPeriod] = useState("monthly");

  useEffect(() => {
    fetchOverview();
    fetchCategoryDistribution();
    fetchSubscriptionDistribution();
    fetchDesignOverview();
  }, [fetchOverview, fetchCategoryDistribution, fetchSubscriptionDistribution, fetchDesignOverview]);

  useEffect(() => {
    fetchUsersGrowth(range);
    fetchOrdersRevenue(range);
    fetchListingsGrowth(range);
  }, [range, fetchUsersGrowth, fetchOrdersRevenue, fetchListingsGrowth]);

  useEffect(() => {
    fetchRecentActivity(activityType);
  }, [activityType, fetchRecentActivity]);

  useEffect(() => {
    fetchRevenueChart(chartPeriod);
  }, [chartPeriod, fetchRevenueChart]);

  const handleActivityTypeChange = useCallback((type) => {
    setActivityType(type);
  }, []);

  const listingsChartData = (() => {
    const map = {};
    (listingsGrowth.ads || []).forEach((d) => {
      map[d._id] = { ...(map[d._id] || {}), date: d._id, ads: d.count };
    });
    (listingsGrowth.products || []).forEach((d) => {
      map[d._id] = { ...(map[d._id] || {}), date: d._id, products: d.count };
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const subscriptionPieData = (subscriptionDistribution || []).map((s) => ({
    name: s._id || "unknown",
    value: s.count,
  }));

  const designPlanPieData = (designOverview?.planDistribution || []).map((s) => ({
    name: s._id || "unknown",
    value: s.count,
  }));

  const designSessionsData = (designOverview?.sessionsByStatus || []).map((s) => ({
    status: s._id || "unknown",
    count: s.count,
  }));

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h1 className="fs-5 me-3">Dashboard Overview</h1>
        <select
          className="form-select form-select-sm w-auto"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="1y">Last 1 year</option>
        </select>
      </div>

      {/* ---- summary cards ---- */}
      <div className="row g-3 mb-4">
        <StatCard label="Total Users" value={overview?.totalUsers ?? "—"} Icon={IconUsers} />
        <StatCard label="Sellers" value={overview?.totalSellers ?? "—"} Icon={IconUserCheck} />
        <StatCard label="Ads" value={overview?.totalAds ?? "—"} Icon={IconAd2} />
        <StatCard label="Products" value={overview?.totalProducts ?? "—"} Icon={IconBox} />
        <StatCard label="Orders" value={overview?.totalOrders ?? "—"} Icon={IconShoppingCart} />
        <StatCard label="Revenue" value={overview?.totalRevenue ?? "—"} Icon={IconCurrencyDollar} />
        <StatCard label="Seller Subscriptions" value={overview?.activeSubscriptions ?? "—"} Icon={IconCrown} />
        <StatCard label="Pending Withdrawals" value={overview?.pendingWithdrawals ?? "—"} Icon={IconCashBanknote} />
        <StatCard label="Pending Reports" value={overview?.pendingReports ?? "—"} Icon={IconFlag} />
      </div>

      {/* ---- revenue chart (orders + subscriptions + featured ads + design plans + commission) ---- */}
      <RevenueChartSection
        data={revenueChart}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        statsLoading={statsLoading}
      />

      {/* ---- charts ---- */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div style={cardBox} className="h-100">
            <h6 className="mb-3 fw-semibold">User Growth</h6>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={usersGrowth}>
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#userGrowthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div style={cardBox} className="h-100">
            <h6 className="mb-3 fw-semibold">Orders & Revenue</h6>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ordersRevenue} barGap={4}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.55} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111827" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#111827" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" name="Orders" fill="url(#ordersGrad)" radius={[6, 6, 0, 0]} maxBarSize={18} />
                <Bar dataKey="revenue" name="Revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div style={cardBox} className="h-100">
            <h6 className="mb-3 fw-semibold">Listings Growth</h6>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={listingsChartData}>
                <defs>
                  <linearGradient id="adsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="productsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7e22ce" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7e22ce" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="ads" name="Ads" stroke="#f97316" strokeWidth={2} fill="url(#adsGrad)" />
                <Area type="monotone" dataKey="products" name="Products" stroke="#7e22ce" strokeWidth={2} fill="url(#productsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div style={cardBox} className="h-100">
            <h6 className="mb-3 fw-semibold">Seller Subscription Distribution</h6>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={subscriptionPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  label
                >
                  {subscriptionPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ---- Design Studio (AI) ---- */}
      <h6 className="fw-semibold mb-2">Design Studio (AI)</h6>
      <div className="row g-3 mb-3">
        <StatCard label="Paid Subscribers" value={designOverview?.paidSubscribers ?? "—"} Icon={IconPalette} />
        <StatCard label="Expiring in 7 days" value={designOverview?.expiringSoon ?? "—"} Icon={IconClockExclamation} />
        <StatCard label="Revenue (30 days)" value={designOverview?.revenueLast30d ?? "—"} Icon={IconCurrencyDollar} />
        <StatCard label="Total Revenue" value={designOverview?.totalRevenue ?? "—"} Icon={IconCurrencyDollar} />
        <StatCard label="AI Generations" value={designOverview?.totalGenerations ?? "—"} Icon={IconSparkles} />
        <StatCard label="AI Edits" value={designOverview?.totalEdits ?? "—"} Icon={IconWand} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div style={cardBox} className="h-100">
            <h6 className="mb-3 fw-semibold">Design Plan Distribution</h6>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={designPlanPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  label
                >
                  {designPlanPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div style={cardBox} className="h-100">
            <h6 className="mb-3 fw-semibold">Design Sessions by Status</h6>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={designSessionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Sessions" fill="#9333ea" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ---- recent activity ---- */}
      <RecentActivityTable
        activeType={activityType}
        onTypeChange={handleActivityTypeChange}
        data={recentActivity}
        statsLoading={statsLoading}
      />
    </div>
  );
};

export default AdminStatsOverview;