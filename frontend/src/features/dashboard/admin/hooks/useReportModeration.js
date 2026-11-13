import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getAllReports, getReportDetails, reviewReport } from "../services/reportModerationAPI"

const useReportModeration = () => {
    const [reportsLoading, setReportsLoading] = useState(false)
    const [reports, setReports] = useState([]);
    const [reportTotal, setReportTotal] = useState(0);
    const [reportDetails, setReportDetails] = useState(null);

    const handleGetAllReports = async () => {
        setReportsLoading(true);
        try {
            const data = await getAllReports();
            setReports(data.data);
            setReportTotal(data.total);
            return true
        } catch (error) {
            toast.error(getToastError(error, "Something went wrong! Cannot get reports"))
            return false
        } finally {
            setReportsLoading(false)
        }
    }

    const handleGetReportDetails = async (reportId) => {
        setReportsLoading(true);
        try {
            const data = await getReportDetails(reportId);
            setReportDetails(data.data);
            return true
        } catch (error) {
            toast.error(getToastError(error, "Something went wrong! Cannot get report details"))
            return false
        } finally {
            setReportsLoading(false)
        }
    }

    const handleReviewReport = async (reportId, payload) => {
        setReportsLoading(true);
        try {
            await reviewReport(reportId, payload);
            toast.success("Report reviewed successfully");
            return true
        } catch (error) {
            toast.error(getToastError(error, "Something went wrong! Cannot review report"))
            return false
        } finally {
            setReportsLoading(false)
        }
    }

    return {
        reports,
        reportTotal,
        reportDetails,
        reportsLoading,
        handleGetAllReports,
        handleGetReportDetails,
        handleReviewReport,
    }
}

export default useReportModeration;