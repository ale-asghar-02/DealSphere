import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getSearchResults } from "../../search/services/searchApi";
import { getAllAds, getAllAdsWithCategorySlug, getSingleAds, getRelativeAds } from "../services/advertisementAPI";

const useAdvertisement = () => {
  const [ads, setAds] = useState(null);
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [relativeAds, setRelativeAds] = useState(null);
  const [adLoading, setAdLoading] = useState(false);

  const handleGetAllAds = async (filters = {}) => {
    setAdLoading(true);
    try {
      const data = await getAllAds(filters);
      setAds(data.data || []);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Cannot fetch advertisements"));
      return false;
    } finally {
      setAdLoading(false);
    }
  };

  const handleSearchAds = async (query, filters = {}) => {
    setAdLoading(true);
    try {
      const data = await getSearchResults(query, "ads", filters);
      setAds(data.data || []);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Cannot search advertisements"));
      return false;
    } finally {
      setAdLoading(false);
    }
  };

  const handleGetAllAdsWithCategorySlug = async (filters) => {
    setAdLoading(true);
    try {
      const data = await getAllAdsWithCategorySlug(filters);
      setAds(data.data || []);
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Cannot fetch advertisements with slug"),
      );
      return false;
    } finally {
      setAdLoading(false);
    }
  };

  const handleGetSingleAds = async ({ id }) => {
    setAdLoading(true);
    try {
      const data = await getSingleAds({ id });
      setAds(data.advertisement);
      setActiveAdsCount(data.activeAdsCount);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Cannot fetch single advertisement"));
      return false;
    } finally {
      setAdLoading(false);
    }
  };

  const handleGetRelativeAds = async ({ categoryId, currentId }) => {
    setAdLoading(true);
    try {
      const data = await getRelativeAds({ categoryId, currentId });
      setRelativeAds(data.advertisements);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Cannot fetch relative advertisements"));
      return false;
    } finally {
      setAdLoading(false);
    }
  };

  return {
    adLoading,
    ads,
    activeAdsCount,
    relativeAds,
    handleGetAllAds,
    handleSearchAds,
    handleGetAllAdsWithCategorySlug,
    handleGetSingleAds,
    handleGetRelativeAds,
  };
};

export default useAdvertisement;
