import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconDownload, IconSend, IconSparkles } from "@tabler/icons-react";

const MIN_INSTRUCTION = 3;
const MAX_INSTRUCTION = 300;

const EDIT_IDEAS = [
  "Make the headline bigger",
  "Change the background to dark blue",
  "Make the price stand out more",
  "Use a cleaner, more minimal layout",
];

/**
 * Tayyar design, version history, edit (sirf likh kar) aur download.
 *   session: { versions: [{ id, source, previewUrl, watermarked, instruction }], editsUsed, error }
 *   usage:   { plan: { editsPerDesign, watermark } }
 *   onEdit:  ({ instruction, versionId }) => promise<{ ok }>
 *   onDownload: (versionId) => promise
 */
const DesignResult = ({ session, usage, busy, onEdit, onDownload }) => {
  const versions = session?.versions || [];
  const latest = versions[versions.length - 1];

  const [selectedId, setSelectedId] = useState(latest?.id);
  const [instruction, setInstruction] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Nayi version aate hi (edit ke baad) usi ko dikhao
  useEffect(() => {
    if (latest?.id) setSelectedId(latest.id);
  }, [latest?.id]);

  const selected = versions.find((v) => v.id === selectedId) || latest;
  const isLatestSelected = selected?.id === latest?.id;

  const editLimit = usage?.plan?.editsPerDesign ?? null;
  const editsUsed = session?.editsUsed || 0;
  const editsLeft = editLimit == null ? null : Math.max(0, editLimit - editsUsed);
  const editsExhausted = editsLeft !== null && editsLeft <= 0;

  const trimmed = instruction.trim();
  const canSend = !busy && !editsExhausted && trimmed.length >= MIN_INSTRUCTION && trimmed.length <= MAX_INSTRUCTION;

  const handleEdit = async (event) => {
    event.preventDefault();
    if (!canSend) return;
    const result = await onEdit({ instruction: trimmed, versionId: isLatestSelected ? undefined : selected.id });
    if (result?.ok) setInstruction("");
  };

  const handleDownload = async () => {
    if (!selected) return;
    setDownloading(true);
    await onDownload(selected.id);
    setDownloading(false);
  };

  if (!selected) return null;

  return (
    <div className="row g-4">
      {/* Preview */}
      <div className="col-12 col-xl-7">
        <div className="ds-preview">
          <img src={selected.previewUrl} alt="Your design" />
        </div>

        {versions.length > 1 && (
          <div className="mt-3">
            <small className="text-muted d-block mb-1">Versions</small>
            <div className="ds-versions">
              {versions.map((version, index) => (
                <button
                  type="button"
                  key={version.id}
                  className={`ds-version ${version.id === selected.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(version.id)}
                  aria-label={`Version ${index + 1}`}
                  aria-pressed={version.id === selected.id}
                >
                  <img src={version.previewUrl} alt="" loading="lazy" />
                  <span>V{index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="col-12 col-xl-5">
        {session?.error && (
          <div className="alert alert-warning rounded-2 py-2">{session.error}</div>
        )}

        <button
          type="button"
          className="btn btn-primary w-100 rounded-2 mb-2"
          style={{ paddingBlock: "12px" }}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          ) : (
            <IconDownload size={18} className="me-2" />
          )}
          Download{versions.length > 1 ? ` version ${versions.findIndex((v) => v.id === selected.id) + 1}` : ""}
        </button>

        {selected.watermarked && (
          <div className="ds-idea mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <small>This design has a watermark. Upgrade to download it without one.</small>
            <Link to="/design/pricing" className="btn btn-outline-primary btn-sm rounded-2">
              Remove watermark
            </Link>
          </div>
        )}

        <hr className="my-4" />

        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="fw-semibold mb-0">Change something</h5>
          {editsLeft !== null && (
            <span className={`badge rounded-pill ${editsExhausted ? "bg-danger" : "bg-primary-subtle text-primary-emphasis"}`}>
              {editsLeft} of {editLimit} edits left
            </span>
          )}
        </div>

        {editsExhausted ? (
          <div className="alert alert-warning rounded-2">
            You have used all edits for this design.{" "}
            {usage?.plan?.name === "free" ? (
              <Link to="/design/pricing" className="fw-semibold">
                Upgrade for more edits
              </Link>
            ) : (
              "You can start a new design anytime."
            )}
          </div>
        ) : (
          <form onSubmit={handleEdit}>
            {!isLatestSelected && (
              <small className="text-muted d-block mb-2">
                Your change will be applied to the version you are viewing.
              </small>
            )}
            <textarea
              className="form-control mb-1"
              rows={3}
              placeholder="Describe the change, for example: make the background darker blue"
              value={instruction}
              maxLength={MAX_INSTRUCTION}
              disabled={busy}
              onChange={(e) => setInstruction(e.target.value)}
              style={{ resize: "none", borderRadius: "0.75rem" }}
            />
            <div className="d-flex justify-content-between mb-3">
              <small className="text-muted">Only describe the change. Everything else stays the same.</small>
              <small className="text-muted">
                {instruction.length}/{MAX_INSTRUCTION}
              </small>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {EDIT_IDEAS.map((idea) => (
                <button type="button" key={idea} className="ds-chip" disabled={busy} onClick={() => setInstruction(idea)}>
                  {idea}
                </button>
              ))}
            </div>

            <button type="submit" className="btn btn-outline-primary w-100 rounded-2" style={{ paddingBlock: "12px" }} disabled={!canSend}>
              {busy ? (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              ) : (
                <IconSend size={18} className="me-2" />
              )}
              Apply change
            </button>
          </form>
        )}

        <hr className="my-4" />

        <Link to="/design" className="btn btn-link text-decoration-none px-0">
          <IconSparkles size={16} className="me-1" />
          Create another design
        </Link>
      </div>
    </div>
  );
};

export default DesignResult;