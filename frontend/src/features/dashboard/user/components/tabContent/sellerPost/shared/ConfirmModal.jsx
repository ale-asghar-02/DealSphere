import { useState } from "react";
import Modal from "@/components/Model";

const ConfirmModal = ({ title, message, confirmText, confirmClass, onConfirm, onClose }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  return (
    <Modal
      show={true}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className={`btn ${confirmClass}`} onClick={handleConfirm} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Please wait...</> : confirmText}
          </button>
        </>
      }
    >
      <p className="mb-0">{message}</p>
    </Modal>
  );
};

export default ConfirmModal;