import { useState } from "react";
import { toast } from "react-toastify";
import { getFieldErrors, getToastError } from "@/utils/validationErrors";
import { fetchSubscription } from "../../../subscription/store/SubscriptionStore";
import { sellerCreateAds, sellerReadAds, sellerUpdateAds, sellerDeleteAds, sellerSoldAds, sellerRenewAds } from "../services/sellerAdsAPI";

const useSellerAds = () => {
  const [adsLoading, setAdsLoading] = useState(false);
  const [ads, setAds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Background reload: no spinner, no toast. Keeps the list and the subscription
  // usage in sync with the server after every change, so no page refresh is needed.
  const syncAll = async () => {
    try {
      const data = await sellerReadAds();
      setAds(data.data || []);
    } catch {
      /* keep the current list if the background reload fails */
    }
    fetchSubscription();
  };

  //* ════════════════════════════════════════════════
  //* ── SELLER HOOKS ──
  //* ════════════════════════════════════════════════

  const handleSellerCreateAd = async (adsData) => {
    setAdsLoading(true);
    try {
      const data = await sellerCreateAds(adsData);
      toast.success("Ad created successfully");
      setAds((prev) => [data.ad, ...prev]);
      fetchSubscription();
      return data;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Something went wrong! Cannot create ad"));
      }
      fetchSubscription(); // limit errors mean the counts changed or were stale
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleSellerReadAds = async () => {
    setAdsLoading(true);
    try {
      const data = await sellerReadAds();
      setAds(data.data || []);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch ads"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  // Same as handleSellerReadAds but silent (used for socket events and after actions)
  const refreshAds = syncAll;

  const handleSellerUpdateAd = async (adsData, adId) => {
    setAdsLoading(true);
    try {
      const data = await sellerUpdateAds(adsData, adId);
      toast.success("Ad updated successfully");
      // The update response has no populated category, so reload the real list
      await syncAll();
      return data;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Something went wrong! Cannot update ad"));
      }
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleSellerDeleteAd = async (adId) => {
    setAdsLoading(true);
    try {
      await sellerDeleteAds(adId);
      toast.success("Ad deleted successfully");
      setAds((prev) => prev.map((ad) => (ad._id === adId ? { ...ad, status: "deleted" } : ad)));
      syncAll();
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot delete ad"));
      return false;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleSellerMarkAsSold = async (adId) => {
    setAdsLoading(true);
    try {
      const data = await sellerSoldAds(adId);
      toast.success("Ad marked as sold");
      setAds((prev) => prev.map((ad) => (ad._id === adId ? { ...ad, ...data.ad, category: ad.category, subCategory: ad.subCategory } : ad)));
      syncAll();
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot mark ad as sold"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleSellerRenewAd = async (adId) => {
    setAdsLoading(true);
    try {
      const data = await sellerRenewAds(adId);
      toast.success("Ad renewed successfully");
      setAds((prev) => prev.map((ad) => (ad._id === adId ? { ...ad, ...data.ad, category: ad.category, subCategory: ad.subCategory } : ad)));
      syncAll();
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot renew ad"));
      fetchSubscription();
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  return {
    adsLoading,
    ads,
    fieldErrors,
    setFieldErrors,

    handleSellerCreateAd,
    handleSellerReadAds,
    refreshAds,
    handleSellerUpdateAd,
    handleSellerDeleteAd,
    handleSellerMarkAsSold,
    handleSellerRenewAd,
  };
};

export default useSellerAds;