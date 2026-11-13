import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { recheckModeration } from "../services/moderationAPI";

const useModeration = () => {
  const [recheckLoading, setRecheckLoading] = useState(false);

  const handleRecheckModeration = async (type, id) => {
    setRecheckLoading(true);
    try {
      const data = await recheckModeration(type, id);
      toast.success("AI re-check completed");
      return data; // { success, message, data: { item, sellerHistory, aiResult, decision } }
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot recheck"));
      return null;
    } finally {
      setRecheckLoading(false);
    }
  };

  return {
    recheckLoading,
    handleRecheckModeration,
  };
};

export default useModeration;