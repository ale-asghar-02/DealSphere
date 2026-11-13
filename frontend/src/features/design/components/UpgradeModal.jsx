import React from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck, IconCrown } from "@tabler/icons-react";
import Modal from "@/components/Model";

const COPY = {
  DESIGN_LIMIT_REACHED: {
    title: "You have reached your design limit",
    fallback: "You have used all your designs for now.",
  },
  DESIGN_EDIT_LIMIT_REACHED: {
    title: "You have used all edits for this design",
    fallback: "You cannot make more edits to this design on your current plan.",
  },
};

const BENEFITS = [
  "Designs without a watermark",
  "Many more designs every month",
  "More edits for each design",
  "Priority for your ideas, any time",
];

/**
 * Limit khatam hone par "Upgrade" popup.
 *   show, onClose, code (DESIGN_LIMIT_REACHED | DESIGN_EDIT_LIMIT_REACHED), message (backend ka text)
 */
const UpgradeModal = ({ show, onClose, code, message }) => {
  const navigate = useNavigate();
  const copy = COPY[code] || COPY.DESIGN_LIMIT_REACHED;

  const handleSeePlans = () => {
    onClose?.();
    navigate("/design/pricing");
  };

  return (
    <Modal
      title={copy.title}
      show={show}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary rounded-2" onClick={onClose}>
            Maybe later
          </button>
          <button type="button" className="btn btn-primary rounded-2" onClick={handleSeePlans}>
            <IconCrown size={16} className="me-2" />
            See plans
          </button>
        </>
      }
    >
      <p className="text-muted">{message || copy.fallback}</p>
      <div className="fw-semibold mb-1">With a paid plan you get:</div>
      <ul className="ds-upgrade-list">
        {BENEFITS.map((benefit) => (
          <li key={benefit}>
            <IconCheck size={18} />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default UpgradeModal;