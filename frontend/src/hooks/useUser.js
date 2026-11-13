import { useState } from "react";
import { toast } from "react-toastify";
import { getSellerProfile, createReport, submitContact, verifyCheckoutSession } from "../services/userAPI";
import { getFieldErrors, getToastError } from "@/utils/validationErrors";

const useUser = () => {
  const [userProfile, setUserProfile] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [profileLoading, setProfileLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleGetSellerProfile = async (usernameSlug) => {
    setProfileLoading(true);
    try {
      const data = await getSellerProfile(usernameSlug);
      setUserProfile(data);
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot submit report"),
      );
      return false;
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateReport = async (payload) => {
    setReportLoading(true);
    try {
      await createReport(payload);
      toast.success("Report submitted successfully");
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot submit report"),
      );
      return false;
    } finally {
      setReportLoading(false);
    }
  };

  const handleSubmitContact = async (payload) => {
    setContactLoading(true);
    try {
      await submitContact(payload);
      toast.success("Your message has been sent successfully");
      return true;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(
          getToastError(error, "Something went wrong! Cannot send message"),
        );
      }
      return false;
    } finally {
      setContactLoading(false);
    }
  };

  const handleVerifySession = async (sessionId) => {
    setVerifyLoading(true);
    try {
      const data = await verifyCheckoutSession(sessionId);
      return data; // { success, flow, paymentStatus, status }
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot verify payment"),
      );
      return null;
    } finally {
      setVerifyLoading(false);
    }
  };

  return {
    userProfile,
    fieldErrors,
    setFieldErrors,

    profileLoading,
    reportLoading,
    contactLoading,
    verifyLoading,

    handleGetSellerProfile,
    handleCreateReport,
    handleSubmitContact,
    handleVerifySession
  };
};

export default useUser;
