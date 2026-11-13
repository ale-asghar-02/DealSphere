import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { adminReadPlans, adminReadPlanById, adminUpdatePlan, adminToggleActive, adminApplyDiscount, adminRemoveDiscount, adminReadSellerSubscriptions } from "../services/subscriptionPlanModerationAPI";

const useSubscriptionPlanModeration = () => {
  const [plans, setPlans] = useState([]);
  const [planDetail, setPlanDetail] = useState(null);
  const [sellerSubscriptions, setSellerSubscriptions] = useState([]);
  const [subscriptionAdminLoading, setSubscriptionAdminLoading] = useState(false);

  const handleReadPlans = async () => {
    setSubscriptionAdminLoading(true);
    try {
      const data = await adminReadPlans();
      setPlans(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch plans"));
      return false;
    } finally {
      setSubscriptionAdminLoading(false);
    }
  };

  const handleReadPlanById = async (id) => {
    setSubscriptionAdminLoading(true);
    try {
      const data = await adminReadPlanById(id);
      setPlanDetail(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch plan"));
      return false;
    } finally {
      setSubscriptionAdminLoading(false);
    }
  };

  const handleUpdatePlan = async (id, payload) => {
    setSubscriptionAdminLoading(true);
    try {
      await adminUpdatePlan(id, payload);
      toast.success("Plan updated successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot update plan"));
      return false;
    } finally {
      setSubscriptionAdminLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    setSubscriptionAdminLoading(true);
    try {
      const data = await adminToggleActive(id);
      setPlans((prev) =>
        prev.map((plan) => (plan._id === id ? data.data : plan))
      );
      toast.success(data.data.isActive ? "Plan activated" : "Plan deactived");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot toggle plan status"));
      return false;
    } finally {
      setSubscriptionAdminLoading(false);
    }
  };


  const handleApplyDiscount = async (id, payload) => {
    setSubscriptionAdminLoading(true);
    try {
      await adminApplyDiscount(id, payload);
      toast.success("Discount applied successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot apply discount"));
      return false;
    } finally {
      setSubscriptionAdminLoading(false);
    }
  };

  const handleRemoveDiscount = async (id) => {
    setSubscriptionAdminLoading(true);
    try {
      await adminRemoveDiscount(id);
      toast.success("Discount removed");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot remove discount"));
      return false;
    } finally {
      setSubscriptionAdminLoading(false);
    }
  };

  const handleReadSellerSubscriptions = async (params) => {
    setSubscriptionAdminLoading(true);
    try {
      const data = await adminReadSellerSubscriptions(params);
      setSellerSubscriptions(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch sellers"));
      return false;
    } finally {
      setSubscriptionAdminLoading(false);
    }
  };

  return {
    plans,
    planDetail,
    sellerSubscriptions,
    subscriptionAdminLoading,
    handleReadPlans,
    handleReadPlanById,
    handleUpdatePlan,
    handleToggleActive,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleReadSellerSubscriptions,
  };
};

export default useSubscriptionPlanModeration;