import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconPhoto, IconSparkles, IconTrash } from "@tabler/icons-react";
import "../design.scss";

import Navbar from "@/components/Navbar/Navbar";
import Modal from "@/components/Model";

import useDesign from "../hooks/useDesign";
import DesignPromptForm from "../components/DesignPromptForm";
import UsageBadge from "../components/UsageBadge";

const STATUS_META = {
  draft: { label: "Draft", className: "bg-secondary" },
  analyzing: { label: "Checking", className: "bg-secondary" },
  questioning: { label: "In progress", className: "bg-info text-dark" },
  ready: { label: "Ready to create", className: "bg-info text-dark" },
  generating: { label: "Creating...", className: "bg-warning text-dark" },
  completed: { label: "Ready", className: "bg-success" },
  failed: { label: "Failed", className: "bg-danger" },
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const LIMIT_CODES = ["DESIGN_LIMIT_REACHED", "DESIGN_EDIT_LIMIT_REACHED"];

const DesignStudio = () => {
  const navigate = useNavigate();
  const {
    designLoading,
    usage,
    designs,
    pagination,
    fetchList,
    removeFromList,
    busy,
    createSession,
    specialError,
    clearSpecialError,
  } = useDesign();

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limitReached = usage?.canGenerate === false;
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 10)));

  const handleCreate = async ({ prompt, image }) => {
    clearSpecialError();
    const result = await createSession({ prompt, image });
    if (result.ok && result.sessionId) navigate(`/design/${result.sessionId}`);
    return result;
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await removeFromList(toDelete.id);
    setDeleting(false);
    setToDelete(null);
  };

  return (
    <div>
      <Navbar />

      <div className="container py-4" style={{ marginBottom: "100px" }}>
        {/* Hero + usage */}
        <div className="ds-hero mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg">
              <span className="ds-eyebrow mb-2">
                <IconSparkles size={14} /> AI Design Studio
              </span>
              <h1 className="ds-title mb-1">Create professional posters and ads in minutes</h1>
              <p className="text-muted mb-0">
                Describe your idea, answer three quick questions, and get a ready-to-use design. Change anything later by just
                typing.
              </p>
            </div>
            <div className="col-12 col-lg-auto">
              <UsageBadge usage={usage} loading={designLoading} />
            </div>
          </div>
        </div>

        {/* Errors from the server (limit, not verified, blocked content) */}
        {specialError && (
          <div className={`alert ${LIMIT_CODES.includes(specialError.code) ? "alert-warning" : "alert-danger"} rounded-2 d-flex flex-wrap align-items-center justify-content-between gap-2`}>
            <span>{specialError.message}</span>
            {LIMIT_CODES.includes(specialError.code) && (
              <Link to="/design/pricing" className="btn btn-primary btn-sm rounded-2 px-3">
                See plans
              </Link>
            )}
          </div>
        )}

        {/* New design */}
        <div className="mb-5">
          <DesignPromptForm
            onSubmit={handleCreate}
            busy={busy}
            disabled={limitReached}
            disabledReason="You have used all your designs for now. Upgrade your plan or come back when your limit resets."
          />
        </div>

        {/* My designs */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-semibold mb-0" style={{ fontSize: "calc(1rem + 0.4vw)" }}>
            My Designs{" "}
            {pagination.total > 0 && (
              <span className="text-muted fs-6"> ({pagination.total}) </span>
            )}
          </h4>
        </div>

        {designs.length === 0 ? (
          <div className="ds-empty">
            <IconPhoto size={44} className="mb-2" />
            <h5 className="fw-semibold mb-1">No designs yet</h5>
            <p className="mb-0">Your finished designs will appear here. Designs are kept for 30 days.</p>
          </div>
        ) : (
          <>
            <div className="row g-3 g-md-4">
              {designs.map((design) => {
                const meta = STATUS_META[design.status] || STATUS_META.draft;
                return (
                  <div key={design.id} className="col-6 col-md-4 col-lg-3">
                    <div
                      className="ds-card"
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/design/${design.id}`)}
                      onKeyDown={(e) => e.key === "Enter" && navigate(`/design/${design.id}`)}
                    >
                      <div className="ds-thumb">
                        {design.thumbnailUrl ? (
                          <img src={design.thumbnailUrl} alt={design.prompt || "Design"} loading="lazy" />
                        ) : design.status === "generating" ? (
                          <div className="text-center">
                            <div className="spinner-border text-primary mb-2" role="status"></div>
                            <div className="small">Creating...</div>
                          </div>
                        ) : (
                          <IconPhoto size={40} />
                        )}

                        <span className={`badge fw-medium rounded-pill ds-status ${meta.className}`}>{meta.label}</span>

                        {design.status !== "generating" && (
                          <button
                            type="button"
                            className="ds-delete"
                            aria-label="Delete design"
                            onClick={(e) => {
                              e.stopPropagation();
                              setToDelete(design);
                            }}
                          >
                            <IconTrash size={16} />
                          </button>
                        )}
                      </div>

                      <div className="p-3">
                        <div className="fw-medium ds-line-clamp mb-1">{design.prompt || "Untitled design"}</div>
                        <small className="text-muted">{formatDate(design.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-center gap-3 mt-4">
                <button
                  className="btn btn-outline-secondary btn-sm rounded-2 px-3"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchList(pagination.page - 1)}
                >
                  Previous
                </button>
                <small className="text-muted">
                  Page {pagination.page} of {totalPages}
                </small>
                <button
                  className="btn btn-outline-secondary btn-sm rounded-2 px-3"
                  disabled={pagination.page >= totalPages}
                  onClick={() => fetchList(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm */}
      <Modal
        title="Delete design"
        show={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setToDelete(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger rounded-2" onClick={handleConfirmDelete} disabled={deleting}>
              <IconTrash size={16} className="me-2" />
              Delete
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">
          This design and all its versions will be deleted permanently. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default DesignStudio;