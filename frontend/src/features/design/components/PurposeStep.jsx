import React, { useState } from "react";
import { IconArrowRight } from "@tabler/icons-react";

// "3:4" -> { width: 3, height: 4 }
const ratioStyle = (ratio) => {
  const [w, h] = String(ratio || "1:1").split(":").map(Number);
  return { aspectRatio: `${w || 1} / ${h || 1}` };
};

/**
 * Sawal 1: ye design kis cheez ke liye hai (size)
 *   question: { options: [{ key, label, realSize, aspectRatio }], suggested }
 *   onSubmit: (body) => promise
 */
const PurposeStep = ({ question, busy, onSubmit }) => {
  const [selected, setSelected] = useState(question?.suggested || null);

  const handleContinue = () => {
    if (!selected) return;
    onSubmit({ step: "purpose", purpose: selected });
  };

  return (
    <div>
      <h4 className="fw-semibold mb-1">{question?.title || "What is this design for?"}</h4>
      <p className="text-muted mb-4">The size of your design will match the real-life size shown.</p>

      <div className="row g-3">
        {(question?.options || []).map((option) => {
          const isSelected = selected === option.key;
          return (
            <div key={option.key} className="col-6 col-md-4">
              <button
                type="button"
                className={`ds-option ${isSelected ? "is-selected" : ""}`}
                disabled={busy}
                onClick={() => setSelected(option.key)}
                aria-pressed={isSelected}
              >
                <div className="ds-ratio-box">
                  <span style={ratioStyle(option.aspectRatio)} />
                </div>
                <div className="fw-semibold">{option.label}</div>
                <small className="text-muted d-block">{option.realSize}</small>
                {question?.suggested === option.key && (
                  <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill mt-2">Suggested for you</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="d-flex justify-content-end mt-4">
        <button
          type="button"
          className="btn btn-primary rounded-2 px-4"
          style={{ paddingBlock: "12px" }}
          disabled={!selected || busy}
          onClick={handleContinue}
        >
          {busy ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : null}
          Continue
          {!busy && <IconArrowRight size={18} className="ms-2" />}
        </button>
      </div>
    </div>
  );
};

export default PurposeStep;