import React, { useEffect, useRef, useState } from "react";
import { IconPhotoPlus, IconSparkles, IconX } from "@tabler/icons-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_MB = 5;
const MIN_LENGTH = 3;
const MAX_LENGTH = 500;

const EXAMPLES = [
  "Sale poster for my clothing brand",
  "Instagram post for a new restaurant menu",
  "Banner for a mobile phone discount",
  "Story ad for a real estate listing",
];

/**
 * Props:
 *   onSubmit({ prompt, image })  -> promise; { ok } wapas aana chahiye
 *   busy                         -> submit ho raha hai
 *   disabled / disabledReason    -> limit khatam ho to form band
 */
const DesignPromptForm = ({ onSubmit, busy = false, disabled = false, disabledReason = "" }) => {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const locked = busy || disabled;
  const trimmed = prompt.trim();
  const canSubmit = !locked && trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  // Preview ka temporary URL saaf karna
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pickFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image is too large. Maximum size is ${MAX_IMAGE_MB}MB.`);
      return;
    }
    setImageError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setImageError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (locked) return;
    pickFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    await onSubmit({ prompt: trimmed, image });
  };

  return (
    <form onSubmit={handleSubmit} className="ds-form-card">
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <label htmlFor="ds-prompt" className="form-label fw-semibold">
            What do you want to create?
          </label>
          <textarea
            id="ds-prompt"
            className="form-control ds-textarea"
            placeholder="For example: A sale poster for my fairness cream, clean and professional"
            value={prompt}
            maxLength={MAX_LENGTH}
            disabled={locked}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="d-flex justify-content-between mt-1">
            <small className="text-muted">Describe the product, offer or event. You can answer details next.</small>
            <small className={prompt.length > MAX_LENGTH - 30 ? "text-danger" : "text-muted"}>
              {prompt.length}/{MAX_LENGTH}
            </small>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((text) => (
              <button type="button" key={text} className="ds-chip" disabled={locked} onClick={() => setPrompt(text)}>
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <label className="form-label fw-semibold">
            Reference image <span className="text-muted fw-normal">(optional)</span>
          </label>

          {preview ? (
            <div className="ds-ref">
              <img src={preview} alt="Reference" />
              <button type="button" className="ds-ref-remove" onClick={removeImage} disabled={busy} aria-label="Remove image">
                <IconX size={16} />
              </button>
            </div>
          ) : (
            <div
              className={`ds-dropzone ${dragOver ? "is-over" : ""} ${locked ? "is-disabled" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            >
              <div>
                <IconPhotoPlus size={30} className="mb-2" />
                <div className="fw-medium">Click or drop an image</div>
                <small>Product photo or inspiration · JPG, PNG, WebP · max {MAX_IMAGE_MB}MB</small>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="d-none"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {imageError && <small className="text-danger d-block mt-1">{imageError}</small>}
        </div>
      </div>

      {disabled && disabledReason && <div className="alert alert-warning rounded-2 py-2 mt-3 mb-0">{disabledReason}</div>}

      <div className="d-flex justify-content-end mt-3">
        <button type="submit" className="btn btn-primary rounded-2 px-4" style={{ paddingBlock: "12px" }} disabled={!canSubmit}>
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Checking your idea...
            </>
          ) : (
            <>
              <IconSparkles size={18} className="me-2" />
              Start designing
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DesignPromptForm;