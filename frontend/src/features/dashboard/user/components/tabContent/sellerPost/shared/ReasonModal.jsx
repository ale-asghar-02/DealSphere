import { IconX, IconAlertTriangle, IconBulb } from "@tabler/icons-react";

const ReasonModal = ({ item, onClose }) => {
  const reason = item?.moderationReason;
  const suggestions = item?.moderationSuggestions || [];

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Moderation Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <p className="text-truncate fw-semibold mb-3">{item?.title}</p>

            <div className="d-flex align-items-start gap-2 mb-3">
              <IconAlertTriangle stroke={1.5} size={20} className="text-danger flex-shrink-0 mt-1" />
              <div>
                <p className="mb-1 fw-semibold">Reason</p>
                <p className="text-muted mb-0">
                  {reason || "No reason provided."}
                </p>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="d-flex align-items-start gap-2">
                <IconBulb stroke={1.5} size={20} className="text-warning flex-shrink-0 mt-1" />
                <div>
                  <p className="mb-1 fw-semibold">Suggestions to fix</p>
                  <ul className="mb-0 ps-3">
                    {suggestions.map((s, i) => (
                      <li key={i} className="text-muted">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;