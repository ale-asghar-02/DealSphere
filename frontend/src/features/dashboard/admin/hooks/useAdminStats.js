import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getOverview, getUsersGrowth, getOrdersRevenue, getListingsGrowth, getCategoryDistribution, getSubscriptionDistribution, getDesignOverview, getRevenueChart, getRecentActivity } from "../services/adminStatsAPI";

const useAdminStats = () => {
  const [statsLoading, setStatsLoading] = useState(false);

  const [overview, setOverview] = useState(null);
  const [usersGrowth, setUsersGrowth] = useState([]);
  const [ordersRevenue, setOrdersRevenue] = useState([]);
  const [listingsGrowth, setListingsGrowth] = useState({ ads: [], products: [] });
  const [categoryDistribution, setCategoryDistribution] = useState({ ads: [], products: [] });
  const [subscriptionDistribution, setSubscriptionDistribution] = useState([]);
  const [designOverview, setDesignOverview] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // ---- individual fetchers (call whichever you need, independently) ----
  // note: getX() already returns response.data (i.e. { success, data }), so no double .data.data

  const fetchOverview = useCallback(async () => {
    try {
      setStatsLoading(true);
      const result = await getOverview();
      setOverview(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsersGrowth = useCallback(async (range = "30d") => {
    try {
      setStatsLoading(true);
      const result = await getUsersGrowth(range);
      setUsersGrowth(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchOrdersRevenue = useCallback(async (range = "30d") => {
    try {
      setStatsLoading(true);
      const result = await getOrdersRevenue(range);
      setOrdersRevenue(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchListingsGrowth = useCallback(async (range = "30d") => {
    try {
      setStatsLoading(true);
      const result = await getListingsGrowth(range);
      setListingsGrowth(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCategoryDistribution = useCallback(async () => {
    try {
      setStatsLoading(true);
      const result = await getCategoryDistribution();
      setCategoryDistribution(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchSubscriptionDistribution = useCallback(async () => {
    try {
      setStatsLoading(true);
      const result = await getSubscriptionDistribution();
      setSubscriptionDistribution(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchDesignOverview = useCallback(async () => {
    try {
      setStatsLoading(true);
      const result = await getDesignOverview();
      setDesignOverview(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRevenueChart = useCallback(async (period = "monthly") => {
    try {
      setStatsLoading(true);
      const result = await getRevenueChart(period);
      setRevenueChart(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRecentActivity = useCallback(async (type) => {
    try {
      setStatsLoading(true);
      const result = await getRecentActivity(type);
      setRecentActivity(result.data);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  return {
    statsLoading,

    overview,
    usersGrowth,
    ordersRevenue,
    listingsGrowth,
    categoryDistribution,
    subscriptionDistribution,
    designOverview,
    revenueChart,
    recentActivity,

    fetchOverview,
    fetchUsersGrowth,
    fetchOrdersRevenue,
    fetchListingsGrowth,
    fetchCategoryDistribution,
    fetchSubscriptionDistribution,
    fetchDesignOverview,
    fetchRevenueChart,
    fetchRecentActivity,
  };
};

export default useAdminStats;