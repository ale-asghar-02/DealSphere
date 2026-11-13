import React, { useState } from "react";
import { IconArrowRight, IconCheck, IconPlus, IconX } from "@tabler/icons-react";

const normalize = (hex) => String(hex || "").toUpperCase();

// Dark rang par safed tick, halke rang par kaala
const tickColor = (hex) => {
  const value = normalize(hex).replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 160 ? "#111" : "#fff";
};

/**
 * Sawal 2: rang (1 se maxColors tak)
 *   question: { presets: [{ key, label, hex }], suggested: [hex], maxColors }
 */
const ColorStep = ({ question, busy, onSubmit }) => {
  const max = question?.maxColors || 3;
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState("#1565C0");

  const toggle = (hex) => {
    const value = normalize(hex);
    setSelected((prev) => {
      if (prev.includes(value)) return prev.filter((c) => c !== value);
      if (prev.length >= max) return prev;
      return [...prev, value];
    });
  };

  const atLimit = selected.length >= max;

  const renderSwatch = (hex, label) => {
    const value = normalize(hex);
    const isSelected = selected.includes(value);
    return (
      <button
        type="button"
        className={`ds-swatch ${isSelected ? "is-selected" : ""}`}
        disabled={busy || (!isSelected && atLimit)}
        onClick={() => toggle(value)}
        aria-pressed={isSelected}
      >
        <span className="ds-swatch-color" style={{ background: value, color: tickColor(value) }}>
          {isSelected && <IconCheck size={16} />}
        </span>
        <span className="fw-medium">{label || value}</span>
      </button>
    );
  };

  return (
    <div>
      <h4 className="fw-semibold mb-1">{question?.title || "Which colors should the design use?"}</h4>
      <p className="text-muted mb-4">
        Choose up to {max} colors. The first color you pick becomes the main one.
      </p>

      {/* Chuni hui colors */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4" style={{ minHeight: 34 }}>
        {selected.length === 0 ? (
          <small className="text-muted">No color selected yet</small>
        ) : (
          selected.map((hex, index) => (
            <span key={hex} className="ds-picked">
              <span className="ds-dot" style={{ background: hex }} />
              {index === 0 ? "Main" : `Color ${index + 1}`} · {hex}
              <button type="button" onClick={() => toggle(hex)} disabled={busy} aria-label={`Remove ${hex}`}>
                <IconX size={14} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* AI ke suggest kiye rang */}
      {question?.suggested?.length > 0 && (
        <div className="mb-4">
          <div className="fw-semibold mb-2">Suggested for your idea</div>
          <div className="row g-2">
            {question.suggested.map((hex) => (
              <div key={hex} className="col-6 col-md-4 col-lg-3">
                {renderSwatch(hex)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset */}
      <div className="mb-4">
        <div className="fw-semibold mb-2">Popular colors</div>
        <div className="row g-2">
          {(question?.presets || []).map((preset) => (
            <div key={preset.key} className="col-6 col-md-4 col-lg-3">
              {renderSwatch(preset.hex, preset.label)}
            </div>
          ))}
        </div>
      </div>

      {/* Apna rang */}
      <div>
        <div className="fw-semibold mb-2">Your own color</div>
        <div className="d-flex align-items-center gap-2">
          <input
            type="color"
            className="form-control form-control-color"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            disabled={busy}
            aria-label="Pick a custom color"
          />
          <button
            type="button"
            className="btn btn-outline-secondary rounded-2"
            disabled={busy || atLimit || selected.includes(normalize(custom))}
            onClick={() => toggle(custom)}
          >
            <IconPlus size={16} className="me-1" />
            Add
          </button>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mt-4">
        <small className="text-muted">
          {selected.length}/{max} selected
        </small>
        <button
          type="button"
          className="btn btn-primary rounded-2 px-4"
          style={{ paddingBlock: "12px" }}
          disabled={selected.length === 0 || busy}
          onClick={() => onSubmit({ step: "color", colors: selected })}
        >
          {busy ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : null}
          Continue
          {!busy && <IconArrowRight size={18} className="ms-2" />}
        </button>
      </div>
    </div>
  );
};

export default ColorStep;