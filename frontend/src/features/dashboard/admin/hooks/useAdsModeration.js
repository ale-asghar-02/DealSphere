import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { adminReadAds, adminReadAdById, adminApproveAd, adminRejectAd, adminDeleteAd, adminBanAd, adminUnbanAd } from "../services/adsModerationAPI";

const useAdsModeration = () => {
  const [adsLoading, setAdsLoading] = useState(false)
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);

  const handleAdminReadAds = async () => {
    setAdsLoading(true);
    try {
      const data = await adminReadAds();
      setAds(data.ads || []);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch ads"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleAdminReadAdById = async (adId) => {
    setAdsLoading(true);
    try {
      const data = await adminReadAdById(adId);
      setSelectedAd(data.ad || null);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch ad"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleAdminApproveAd = async (adId) => {
    setAdsLoading(true);
    try {
      const data = await adminApproveAd(adId);
      toast.success("Ad approved successfully");
      setAds((prev) => prev.map((ad) => (ad._id === adId ? data.ad : ad)));
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot approve ad"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleAdminRejectAd = async (adId) => {
    setAdsLoading(true);
    try {
      const data = await adminRejectAd(adId);
      toast.success("Ad rejected successfully");
      setAds((prev) => prev.map((ad) => (ad._id === adId ? data.ad : ad)));
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot reject ad"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleAdminDeleteAd = async (adId) => {
    setAdsLoading(true);
    try {
      await adminDeleteAd(adId);
      toast.success("Ad deleted successfully");
      setAds((prev) => prev.filter((ad) => ad._id !== adId));
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot delete ad"));
      return false;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleAdminBanAd = async (adId) => {
    setAdsLoading(true);
    try {
      const data = await adminBanAd(adId);
      toast.success("Ad banned successfully");
      setAds((prev) => prev.map((ad) => (ad._id === adId ? data.ad : ad)));
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot ban ad"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  const handleAdminUnbanAd = async (adId) => {
    setAdsLoading(true);
    try {
      const data = await adminUnbanAd(adId);
      toast.success("Ad unbanned successfully");
      setAds((prev) => prev.map((ad) => (ad._id === adId ? data.ad : ad)));
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot unban ad"));
      return null;
    } finally {
      setAdsLoading(false);
    }
  };

  return {
    adsLoading,
    ads,
    selectedAd,

    handleAdminReadAds,
    handleAdminReadAdById,
    handleAdminApproveAd,
    handleAdminRejectAd,
    handleAdminDeleteAd,
    handleAdminBanAd,
    handleAdminUnbanAd,
  };
};

export default useAdsModeration;