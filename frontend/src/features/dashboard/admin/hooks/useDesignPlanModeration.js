import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";

import {
  adminReadDesignPlans,
  adminReadDesignPlanById,
  adminUpdateDesignPlan,
  adminToggleDesignPlanActive,
  adminApplyDesignDiscount,
  adminRemoveDesignDiscount,
  adminReadDesignSubscribers,
} from "../services/designPlanModerationAPI";

const useDesignPlanModeration = () => {
  const [designPlans, setDesignPlans] = useState([]);
  const [designPlanDetail, setDesignPlanDetail] = useState(null);
  const [designSubscribers, setDesignSubscribers] = useState([]);
  const [designAdminLoading, setDesignAdminLoading] = useState(false);

  const handleReadDesignPlans = async () => {
    setDesignAdminLoading(true);
    try {
      const data = await adminReadDesignPlans();
      setDesignPlans(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch design plans"));
      return false;
    } finally {
      setDesignAdminLoading(false);
    }
  };

  const handleReadDesignPlanById = async (id) => {
    setDesignAdminLoading(true);
    try {
      const data = await adminReadDesignPlanById(id);
      setDesignPlanDetail(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch design plan"));
      return false;
    } finally {
      setDesignAdminLoading(false);
    }
  };

  const handleUpdateDesignPlan = async (id, payload) => {
    setDesignAdminLoading(true);
    try {
      await adminUpdateDesignPlan(id, payload);
      toast.success("Design plan updated successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot update design plan"));
      return false;
    } finally {
      setDesignAdminLoading(false);
    }
  };

  const handleToggleDesignPlanActive = async (id) => {
    setDesignAdminLoading(true);
    try {
      const data = await adminToggleDesignPlanActive(id);
      setDesignPlans((prev) =>
        prev.map((plan) => (plan._id === id ? data.data : plan))
      );
      toast.success(data.data.isActive ? "Design plan activated" : "Design plan deactivated");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot toggle design plan status"));
      return false;
    } finally {
      setDesignAdminLoading(false);
    }
  };

  const handleApplyDesignDiscount = async (id, payload) => {
    setDesignAdminLoading(true);
    try {
      await adminApplyDesignDiscount(id, payload);
      toast.success("Discount applied successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot apply discount"));
      return false;
    } finally {
      setDesignAdminLoading(false);
    }
  };

  const handleRemoveDesignDiscount = async (id) => {
    setDesignAdminLoading(true);
    try {
      await adminRemoveDesignDiscount(id);
      toast.success("Discount removed");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot remove discount"));
      return false;
    } finally {
      setDesignAdminLoading(false);
    }
  };

  const handleReadDesignSubscribers = async (params) => {
    setDesignAdminLoading(true);
    try {
      const data = await adminReadDesignSubscribers(params);
      setDesignSubscribers(data.data);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch design subscribers"));
      return false;
    } finally {
      setDesignAdminLoading(false);
    }
  };

  return {
    designPlans,
    designPlanDetail,
    designSubscribers,
    designAdminLoading,
    handleReadDesignPlans,
    handleReadDesignPlanById,
    handleUpdateDesignPlan,
    handleToggleDesignPlanActive,
    handleApplyDesignDiscount,
    handleRemoveDesignDiscount,
    handleReadDesignSubscribers,
  };
};

export default useDesignPlanModeration;