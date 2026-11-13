import React, { useState } from "react";
import { IconArrowRight, IconPlus, IconX } from "@tabler/icons-react";

// Backend ki value (null / undefined / number / array) ko form ki value mein badalna
const initialValue = (field, value) => {
  if (field.type === "list") return Array.isArray(value) && value.length ? value : [""];
  if (value === null || value === undefined) return "";
  return String(value);
};

/**
 * Sawal 3: design par kya likha hoga
 *   question: { fields: [{ key, label, type, required, maxLength, maxItems }], values, hint }
 *   AI ne prompt se jo cheezein samajh li hon wo pehle se bhari hoti hain.
 */
const ContentStep = ({ question, busy, onSubmit }) => {
  const fields = question?.fields || [];

  const [form, setForm] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.key, initialValue(field, question?.values?.[field.key])]))
  );
  const [errors, setErrors] = useState({});

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const setListItem = (key, index, value) => {
    setValue(key, form[key].map((item, i) => (i === index ? value : item)));
  };

  const addListItem = (key) => setValue(key, [...form[key], ""]);

  const removeListItem = (key, index) => {
    const next = form[key].filter((_, i) => i !== index);
    setValue(key, next.length ? next : [""]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    const body = { step: "content" };

    fields.forEach((field) => {
      const raw = form[field.key];

      if (field.type === "list") {
        const items = raw.map((item) => item.trim()).filter(Boolean);
        if (items.length) body[field.key] = items;
        return;
      }

      const value = String(raw ?? "").trim();
      if (!value) {
        if (field.required) nextErrors[field.key] = `${field.label} is required`;
        return;
      }
      if (field.type === "number") {
        const number = Number(value.replace(/,/g, ""));
        if (Number.isNaN(number) || number < 0) {
          nextErrors[field.key] = "Enter a valid number";
          return;
        }
        body[field.key] = number;
      } else {
        body[field.key] = value;
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(body);
  };

  const renderField = (field) => {
    const error = errors[field.key];
    const id = `ds-field-${field.key}`;

    if (field.type === "list") {
      const items = form[field.key] || [];
      return (
        <div>
          {items.map((item, index) => (
            <div className="input-group mb-2" key={index}>
              <input
                type="text"
                className="form-control"
                placeholder={`Feature ${index + 1}`}
                value={item}
                maxLength={field.maxLength}
                disabled={busy}
                onChange={(e) => setListItem(field.key, index, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={busy}
                onClick={() => removeListItem(field.key, index)}
                aria-label="Remove feature"
              >
                <IconX size={16} />
              </button>
            </div>
          ))}
          {items.length < (field.maxItems || 6) && (
            <button type="button" className="btn btn-sm btn-outline-primary rounded-2" disabled={busy} onClick={() => addListItem(field.key)}>
              <IconPlus size={14} className="me-1" />
              Add feature
            </button>
          )}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <>
          <textarea
            id={id}
            rows={3}
            className={`form-control ${error ? "is-invalid" : ""}`}
            value={form[field.key]}
            maxLength={field.maxLength}
            disabled={busy}
            onChange={(e) => setValue(field.key, e.target.value)}
          />
          {error && <div className="invalid-feedback">{error}</div>}
        </>
      );
    }

    return (
      <>
        <input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          min={field.type === "number" ? 0 : undefined}
          inputMode={field.type === "number" ? "numeric" : undefined}
          className={`form-control ${error ? "is-invalid" : ""}`}
          value={form[field.key]}
          maxLength={field.maxLength}
          disabled={busy}
          onChange={(e) => setValue(field.key, e.target.value)}
        />
        {error && <div className="invalid-feedback">{error}</div>}
      </>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h4 className="fw-semibold mb-1">{question?.title || "What should be written on the design?"}</h4>
      <p className="text-muted mb-4">{question?.hint}</p>

      <div className="row g-3">
        {fields.map((field) => {
          const wide = field.type === "list" || field.type === "textarea" || field.key === "title";
          return (
            <div key={field.key} className={wide ? "col-12" : "col-12 col-md-6"}>
              <label htmlFor={`ds-field-${field.key}`} className="form-label fw-medium">
                {field.label}
                {field.required ? <span className="text-danger"> *</span> : <span className="text-muted fw-normal"> (optional)</span>}
              </label>
              {renderField(field)}
            </div>
          );
        })}
      </div>

      <div className="d-flex justify-content-end mt-4">
        <button type="submit" className="btn btn-primary rounded-2 px-4" style={{ paddingBlock: "12px" }} disabled={busy}>
          {busy ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : null}
          Continue
          {!busy && <IconArrowRight size={18} className="ms-2" />}
        </button>
      </div>
    </form>
  );
};

export default ContentStep;