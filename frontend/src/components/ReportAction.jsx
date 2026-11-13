import { useState } from "react";
import { IconFlag } from "@tabler/icons-react";
import Modal from "./Model";
import useUser from "../hooks/useUser";

const REPORT_REASONS = [
  { label: "Fake listing", value: "fake_listing" },
  { label: "Scam / Fraud", value: "scam" },
  { label: "Abusive or offensive", value: "abusive" },
  { label: "Spam", value: "spam" },
  { label: "Inappropriate content", value: "inappropriate" },
  { label: "Other", value: "other" },
];

const DEFAULT_LABELS = {
  ad: "Report this ad",
  product: "Report this product",
  seller: "Report this user",
};

const ReportAction = ({
  reportType,
  targetId,
  chatId,
  label,
  buttonClassName = "dropdown-item d-flex align-items-center gap-2 py-2 px-3",
  buttonStyle = { fontSize: "13px", color: "#d32f2f" },
  onTriggerClick,
}) => {
  const { handleCreateReport, reportLoading } = useUser();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const resetAndClose = () => {
    setShowReportModal(false);
    setReportReason("");
    setReportDescription("");
    onTriggerClick?.();
  };

  const handleReportSubmit = async () => {
    if (!reportReason) return;

    const payload = {
      reportType,
      reason: reportReason,
      description: reportDescription,
    };

    // ✅ chat report mein targetId nahi jata — chatId se server khud target derive karta hai (security)
    if (reportType === "chat") {
      payload.chatId = chatId;
    } else {
      payload.targetId = targetId;
    }

    const success = await handleCreateReport(payload);

    if (success) {
      resetAndClose();
    }
  };

  const modalTitle = label || DEFAULT_LABELS[reportType] || "Report";

  return (
    <>
      <button
        className={buttonClassName}
        style={buttonStyle}
        onClick={() => setShowReportModal(true)}
      >
        <IconFlag size={15} /> {modalTitle}
      </button>

      <Modal show={showReportModal} onClose={resetAndClose} title={modalTitle} footer={
        <>
          <button className="btn btn-sm btn-light px-3" onClick={resetAndClose}>
            Cancel
          </button>
          <button
            className="btn btn-sm px-3"
            style={{ background: reportReason ? "#002f34" : "#ccc", color: "#fff" }}
            disabled={!reportReason || reportLoading}
            onClick={handleReportSubmit}
          >
            {reportLoading ? "Submitting..." : "Submit Report"}
          </button>
        </>
      }>
        <p style={{ fontSize: "13px", color: "#555" }}>
          Why are you reporting this? ({modalTitle})
        </p>

        {REPORT_REASONS.map((reason) => (
          <div
            key={reason.value}
            className="d-flex align-items-center gap-2 px-3 py-2 rounded mb-2"
            style={{
              cursor: "pointer",
              border: reportReason === reason.value ? "1.5px solid #002f34" : "1.5px solid #ddd",
              background: reportReason === reason.value ? "#e8f4f4" : "#fff",
            }}
            onClick={() => setReportReason(reason.value)}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                border: reportReason === reason.value ? "5px solid #002f34" : "2px solid #aaa",
              }}
            />
            <span style={{ fontSize: "13px" }}>{reason.label}</span>
          </div>
        ))}

        {reportReason && (
          <textarea
            className="form-control mt-2"
            placeholder="Tell us more about the issue (optional)"
            rows={3}
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            style={{ fontSize: "13px", resize: "none" }}
          />
        )}
      </Modal>
    </>
  );
};

export default ReportAction;