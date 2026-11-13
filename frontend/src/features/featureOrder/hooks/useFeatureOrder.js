import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "../../../utils/validationErrors";
import { featuredPlans, featuredStatus, featuredCheckout, featureWithSubscription } from "../services/featureOrderAPI";

const useFeatureOrder = () => {
  const [plans, setPlans] = useState(null);
  const [status, setStatus] = useState(null);
  const [featureLoading, setFeatureLoading] = useState(false);

  const handleFeaturePlans = async () => {
    setFeatureLoading(true);
    try {
      const data = await featuredPlans();
      setPlans(data.plans);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to fetch plans"));
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleFeatureStatus = async (itemType, itemId) => {
    setFeatureLoading(true);
    try {
      const data = await featuredStatus({ itemType, itemId });
      setStatus(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to fetch feature status"));
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleFeatureCheckout = async (itemType, itemId, plan) => {
    setFeatureLoading(true);
    try {
      const data = await featuredCheckout({ itemType, itemId, plan });
      if (data.url) {
        window.location.href = data.url;
      }
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to start checkout"));
      return false;
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleFeatureWithSubscription = async (itemType, itemId) => {
    setFeatureLoading(true);
    try {
      const data = await featureWithSubscription({ itemType, itemId });
      toast.success(data.message || "Item featured successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to feature using subscription"));
      return false;
    } finally {
      setFeatureLoading(false);
    }
  };

  return {
    plans,
    status,
    featureLoading,
    handleFeaturePlans,
    handleFeatureStatus,
    handleFeatureCheckout,
    handleFeatureWithSubscription,
  };
};

export default useFeatureOrder;