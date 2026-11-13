import { useState, useEffect, useMemo } from "react";
import {
  IconFlag, IconEye, IconAlertCircle, IconTrashX, IconUserX, IconX, IconClock,
  IconPackage, IconShoppingBag, IconUser, IconMessageCircle,
} from "@tabler/icons-react";

import useReportModeration from "../../hooks/useReportModeration";
import useAdminSearch from "../../hooks/useAdminSearch";
import AdminSearchBar from "../AdminSearcBar"
import Modal from "@/components/Model";

const STATUS_BADGE = {
  pending: { className: "bg-warning text-dark", label: "Pending" },
  resolved: { className: "bg-success text-white", label: "Resolved" },
  dismissed: { className: "bg-secondary text-white", label: "Dismissed" },
};

const ACTION_BADGE = {
  none: "—",
  warn: "Warned",
  remove: "Removed",
  suspend: "Suspended",
  ban: "Banned",
};

const REASON_LABELS = {
  fake_listing: "Fake listing",
  scam: "Scam / Fraud",
  abusive: "Abusive or offensive",
  spam: "Spam",
  inappropriate: "Inappropriate content",
  other: "Other",
};

const TYPE_ICON = {
  ad: IconShoppingBag,
  product: IconPackage,
  seller: IconUser,
  chat: IconMessageCircle,
};

// report types jinka final target hamesha ek "User" hota hai (listing nahi)
const USER_TARGET_TYPES = ["seller", "chat"];

// ── Chat evidence block ───────────────────────────────────
const ChatEvidence = ({ chatEvidence }) => {
  if (!chatEvidence?.messages?.length) {
    return (
      <div className="text-center text-muted py-3" style={{ fontSize: "12px" }}>
        No messages found in this conversation
      </div>
    );
  }

  return (
    <div
      className="border rounded-2 p-2 mb-3"
      style={{ maxHeight: "220px", overflowY: "auto", background: "#fafafa" }}
    >
      {chatEvidence.messages.map((m) => (
        <div
          key={m._id}
          className="mb-2 p-2 rounded-2"
          style={{
            fontSize: "12px",
            maxWidth: "80%",
            marginLeft: m.sender?._id === chatEvidence.chat?.participant1?._id ? "0" : "auto",
            background: m.sender?._id === chatEvidence.chat?.participant1?._id ? "#eef2f2" : "#e3f2fd",
          }}
        >
          <div className="fw-semibold" style={{ fontSize: "11px", color: "#555" }}>
            {m.sender?.username || "Unknown"}
          </div>
          {m.isDeleted ? (
            <em className="text-muted">Message deleted</em>
          ) : m.image?.url ? (
            <img src={m.image.url} alt="" style={{ maxWidth: "100%", borderRadius: "4px" }} />
          ) : (
            <div>{m.text}</div>
          )}
          <div style={{ fontSize: "10px", color: "#999" }}>
            {new Date(m.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Review modal ──────────────────────────────────────────
const ReviewReportModal = ({ show, onClose, report, target, chatEvidence, onSubmit, submitting }) => {
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("1m");

  // Modal open hote hi report ke current DB data se fields prefill karo
  useEffect(() => {
    if (show && report) {
      if (report.status === "dismissed") {
        setAction("dismiss");
      } else if (report.actionTaken && report.actionTaken !== "none") {
        setAction(report.actionTaken);
      } else {
        setAction("");
      }

      setReason(report.adminReason || "");
      setDuration(report.suspensionDuration || "1m");
    }
  }, [show, report]);

  if (!report) return null;

  const isUserTarget = USER_TARGET_TYPES.includes(report.reportType);
  const isChat = report.reportType === "chat";
  const isReadOnly = report.status !== "pending";

  const handleSubmit = async () => {
    if (isReadOnly) return;
    if (!action || !reason.trim()) return;
    const payload = { action, reason };
    if (action === "suspend") payload.duration = duration;
    await onSubmit(report._id, payload);
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={isReadOnly ? "View Report" : "Review Report"}
      footer={
        <>
          <button className="btn btn-sm btn-light px-3" onClick={onClose}>
            {isReadOnly ? "Close" : "Cancel"}
          </button>
          {!isReadOnly && (
            <button
              className="btn btn-sm px-3 text-white"
              style={{ background: action && reason.trim() ? "#002f34" : "#ccc" }}
              disabled={!action || !reason.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit Decision"}
            </button>
          )}
        </>
      }
    >
      {/* Target summary */}
      <div className="d-flex align-items-center gap-2 p-2 rounded mb-3" style={{ background: "#f5f5f5" }}>
        {!isUserTarget && (target?.adsImages?.[0]?.url || target?.productImages?.[0]?.url) ? (
          <img
            src={target?.adsImages?.[0]?.url || target?.productImages?.[0]?.url}
            alt=""
            style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "6px" }}
          />
        ) : isUserTarget && target?.userImage ? (
          <img
            src={target.userImage}
            alt=""
            style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "50%" }}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center rounded"
            style={{ width: "44px", height: "44px", background: "#e0e0e0" }}
          >
            {isUserTarget ? <IconUser size={20} color="#777" /> : <IconPackage size={20} color="#777" />}
          </div>
        )}
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="fw-semibold text-truncate" style={{ fontSize: "13px" }}>
            {isUserTarget ? target?.username : target?.title || "Unknown"}
          </div>
          <div style={{ fontSize: "11px", color: "#777" }}>
            {isUserTarget ? target?.email : target?.price ? `Rs. ${target.price}` : ""}
          </div>
        </div>
        {isChat && (
          <span className="badge bg-light text-dark border" style={{ fontSize: "10px" }}>
            Reported from chat
          </span>
        )}
      </div>

      {/* Report info */}
      <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
          <span style={{ fontSize: "12px", color: "#777" }}>Reported by</span>
          <span style={{ fontSize: "12px", fontWeight: 500 }}>{report.reportedBy?.username}</span>
        </div>
        <div className="d-flex justify-content-between mb-1">
          <span style={{ fontSize: "12px", color: "#777" }}>Reason</span>
          <span style={{ fontSize: "12px", fontWeight: 500 }}>{REASON_LABELS[report.reason]}</span>
        </div>
        {report.description && (
          <div className="mt-2 p-2 rounded" style={{ background: "#f9f9f9", fontSize: "12px", color: "#444" }}>
            {report.description}
          </div>
        )}
      </div>

      {/* Chat evidence — sirf chat reports ke liye */}
      {isChat && (
        <>
          <p className="mb-2 fw-semibold" style={{ fontSize: "13px" }}>Conversation</p>
          <ChatEvidence chatEvidence={chatEvidence} />
        </>
      )}

      <hr className="my-3" />

      <p className="mb-2 fw-semibold" style={{ fontSize: "13px" }}>
        {isReadOnly ? "Action taken" : "Choose an action"}
      </p>
      <div className="d-flex flex-column gap-2 mb-3">
        {[
          { value: "dismiss", label: "Dismiss report", icon: IconX },
          { value: "warn", label: isUserTarget ? "Warn user" : "Warn seller", icon: IconAlertCircle },
          ...(isUserTarget ? [] : [{ value: "remove", label: "Remove listing", icon: IconTrashX }]),
          { value: "suspend", label: isUserTarget ? "Suspend user" : "Suspend seller", icon: IconClock },
          { value: "ban", label: isUserTarget ? "Ban user" : "Ban seller", icon: IconUserX },
        ]
          .filter((opt) => !isReadOnly || opt.value === action)
          .map((opt) => (
            <div
              key={opt.value}
              className="d-flex align-items-center gap-2 px-3 py-2 rounded"
              style={{
                cursor: isReadOnly ? "default" : "pointer",
                border: action === opt.value ? "1.5px solid #002f34" : "1.5px solid #ddd",
                background: action === opt.value ? "#e8f4f4" : "#fff",
                opacity: isReadOnly && action !== opt.value ? 0.5 : 1,
              }}
              onClick={() => !isReadOnly && setAction(opt.value)}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: action === opt.value ? "5px solid #002f34" : "2px solid #aaa",
                  flexShrink: 0,
                }}
              />
              <opt.icon size={16} color="#555" />
              <span style={{ fontSize: "13px" }}>{opt.label}</span>
            </div>
          ))}
      </div>

      {action === "suspend" && (
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: "12px" }}>Suspension duration</label>
          <select
            className="form-select form-select-sm"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isReadOnly}
          >
            <option value="1m">1 month</option>
            <option value="3m">3 months</option>
            <option value="6m">6 months</option>
            <option value="1y">1 year</option>
          </select>
        </div>
      )}

      {action && (
        <div>
          <label className="form-label" style={{ fontSize: "12px" }}>Reason (shown to the user)</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Explain the decision..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ fontSize: "13px", resize: "none" }}
            readOnly={isReadOnly}
            disabled={isReadOnly}
          />
        </div>
      )}
    </Modal>
  );
};

// ── Main page ─────────────────────────────────────────────
const Reports = () => {
  const {
    reports, reportDetails, reportsLoading,
    handleGetAllReports, handleGetReportDetails, handleReviewReport,
  } = useReportModeration();

  const {
    results: searchResults,
    searchLoading,
    handleSearch,
    clearSearch,
  } = useAdminSearch("reports");

  const [isSearching, setIsSearching] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    handleGetAllReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseReports = isSearching ? searchResults : reports;

  const filteredReports = useMemo(() => {
    return baseReports.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (typeFilter && r.reportType !== typeFilter) return false;
      return true;
    });
  }, [baseReports, statusFilter, typeFilter]);

  const isLoading = isSearching ? searchLoading : (reportsLoading && reports.length === 0);

  const onSearch = (query) => {
    setIsSearching(true);
    handleSearch(query);
  };

  const onClearSearch = () => {
    setIsSearching(false);
    clearSearch();
  };

  const openReview = async (reportId) => {
    setShowReviewModal(true);
    await handleGetReportDetails(reportId);
  };

  const closeReview = () => {
    setShowReviewModal(false);
  };

  const handleSubmitReview = async (reportId, payload) => {
    const success = await handleReviewReport(reportId, payload);
    if (success) {
      closeReview();
      handleGetAllReports();
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 mb-md-1">
        <h1 className="fs-5 me-3 mb-0">Reports</h1>
        <AdminSearchBar
          type="reports"
          placeholder="Search reports..."
          onSearch={onSearch}
          onClear={onClearSearch}
        />
      </div>

      {/* filters */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select form-select-sm"
          style={{ width: "160px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          className="form-select form-select-sm"
          style={{ width: "160px" }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="ad">Advertisement</option>
          <option value="product">Product</option>
          <option value="seller">Seller</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      {/* table */}
      <div className="table-responsive border rounded-2 position-relative">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className="rounded-start" style={{ width: "60px" }}>Type</th>
              <th className="text-start text-nowrap">Reported By</th>
              <th className="text-dark">Reason</th>
              <th className="text-dark">Status</th>
              <th className="text-dark text-nowrap">Action Taken</th>
              <th className="rounded-end text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">
                  No reports found
                </td>
              </tr>
            ) : (
              filteredReports.map((r) => {
                const TypeIcon = TYPE_ICON[r.reportType] || IconFlag;
                const badge = STATUS_BADGE[r.status];
                return (
                  <tr key={r._id} className="border-bottom">
                    <td className="px-xl-0">
                      <span className="d-inline-flex align-items-center justify-content-center bg-light rounded-2 p-2">
                        <TypeIcon size={18} stroke={1.5} />
                      </span>
                    </td>
                    <td className="text-start">
                      <span className="fw-medium text-dark">
                        {r.reportedBy?.username || r.reporter?.username || "—"}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {REASON_LABELS[r.reason] || r.reason}
                    </td>
                    <td>
                      <span className={`badge fw-normal p-2 ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td className="text-muted small">
                      {ACTION_BADGE[r.actionTaken]}
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center" style={{ width: "fit-content", margin: "0 auto" }}>
                        <button
                          type="button"
                          title={r.status === "pending" ? "Review" : "View"}
                          className="btn btn-sm btn-outline-primary p-0"
                          onClick={() => openReview(r._id)}
                        >
                          <IconEye stroke={1.5} size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ReviewReportModal
        show={showReviewModal}
        onClose={closeReview}
        report={reportDetails?.report}
        target={reportDetails?.target}
        chatEvidence={reportDetails?.chatEvidence}
        onSubmit={handleSubmitReview}
        submitting={reportsLoading}
      />
    </div>
  );
};

export default Reports;