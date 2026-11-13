import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { adminReadFeaturePlans, adminReadFeaturePlanById, adminUpdateFeaturePlan, adminToggleFeaturePlanActive, adminApplyFeatureDiscount, adminRemoveFeatureDiscount } from "../services/featurePlanModerationAPI";

const useFeaturePlanModeration = () => {
  const [featurePlans, setFeaturePlans] = useState([]);
  const [featurePlanDetail, setFeaturePlanDetail] = useState(null);
  const [featurePlanLoading, setFeaturePlanLoading] = useState(false);

  const handleReadFeaturePlans = async () => {
    setFeaturePlanLoading(true);
    try {
      const data = await adminReadFeaturePlans();
      setFeaturePlans(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch feature plans"));
      return false;
    } finally {
      setFeaturePlanLoading(false);
    }
  };

  const handleReadFeaturePlanById = async (id) => {
    setFeaturePlanLoading(true);
    try {
      const data = await adminReadFeaturePlanById(id);
      setFeaturePlanDetail(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch plan"));
      return false;
    } finally {
      setFeaturePlanLoading(false);
    }
  };

  const handleUpdateFeaturePlan = async (id, payload) => {
    setFeaturePlanLoading(true);
    try {
      await adminUpdateFeaturePlan(id, payload);
      toast.success("Plan updated successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot update plan"));
      return false;
    } finally {
      setFeaturePlanLoading(false);
    }
  };

  const handleToggleFeaturePlanActive = async (id) => {
    setFeaturePlanLoading(true);
    try {
      await adminToggleFeaturePlanActive(id);
      toast.success("Plan status updated");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot update status"));
      return false;
    } finally {
      setFeaturePlanLoading(false);
    }
  };

  const handleApplyFeatureDiscount = async (id, payload) => {
    setFeaturePlanLoading(true);
    try {
      await adminApplyFeatureDiscount(id, payload);
      toast.success("Discount applied successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot apply discount"));
      return false;
    } finally {
      setFeaturePlanLoading(false);
    }
  };

  const handleRemoveFeatureDiscount = async (id) => {
    setFeaturePlanLoading(true);
    try {
      await adminRemoveFeatureDiscount(id);
      toast.success("Discount removed");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot remove discount"));
      return false;
    } finally {
      setFeaturePlanLoading(false);
    }
  };

  return {
    featurePlans,
    featurePlanDetail,
    featurePlanLoading,
    handleReadFeaturePlans,
    handleReadFeaturePlanById,
    handleUpdateFeaturePlan,
    handleToggleFeaturePlanActive,
    handleApplyFeatureDiscount,
    handleRemoveFeatureDiscount,
  };
};

export default useFeaturePlanModeration;