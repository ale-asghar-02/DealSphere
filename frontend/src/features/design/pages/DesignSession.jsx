import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconSparkles, IconTrash } from "@tabler/icons-react";
import "../design.scss";

import Navbar from "@/components/Navbar/Navbar";
import Modal from "@/components/Model";
import Loading from "@/components/Loading";

import useDesign from "../hooks/useDesign";
import UsageBadge from "../components/UsageBadge";
import PurposeStep from "../components/PurposeStep";
import ColorStep from "../components/ColorStep";
import ContentStep from "../components/ContentStep";
import GeneratingView from "../components/GeneratingView";
import DesignResult from "../components/DesignResult";
import UpgradeModal from "../components/UpgradeModal";

const STEPS = ["Idea", "Size", "Colors", "Content", "Create"];
const STEP_INDEX = { purpose: 1, color: 2, content: 3, generate: 4, generating: 4, done: 5 };
const LIMIT_CODES = ["DESIGN_LIMIT_REACHED", "DESIGN_EDIT_LIMIT_REACHED"];

const Stepper = ({ current }) => (
  <div className="ds-stepper" aria-label="Progress">
    {STEPS.map((label, index) => {
      const state = index < current ? "is-done" : index === current ? "is-active" : "";
      return (
        <React.Fragment key={label}>
          <div className={`ds-step ${state}`}>
            <span className="ds-step-dot">{index < current ? <IconCheck size={14} /> : index + 1}</span>
            <span className="d-none d-sm-inline">{label}</span>
          </div>
          {index < STEPS.length - 1 && <span className="ds-step-line" />}
        </React.Fragment>
      );
    })}
  </div>
);

const DesignSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    designLoading,
    usage,
    session,
    question,
    busy,
    progress,
    specialError,
    clearSpecialError,
    submitAnswer,
    generate,
    edit,
    download,
    removeSession,
  } = useDesign(id);

  const [showDelete, setShowDelete] = useState(false);

  const step = question?.step;
  const isGenerating = session?.status === "generating" || step === "generating";
  const currentIndex = STEP_INDEX[isGenerating ? "generating" : step] ?? 1;

  const upgradeOpen = Boolean(specialError && LIMIT_CODES.includes(specialError.code));
  const inlineError = specialError && !LIMIT_CODES.includes(specialError.code) ? specialError : null;

  const handleDelete = async () => {
    const result = await removeSession();
    setShowDelete(false);
    if (result.ok) navigate("/design");
  };

  if (!session) {
    return (
      <div>
        <Navbar />
        <div className="container py-5 text-center">
          <IconAlertTriangle size={44} className="text-muted mb-2" />
          <h5 className="fw-semibold">Design not found</h5>
          <p className="text-muted">It may have been deleted or is older than 30 days.</p>
          <Link to="/design" className="btn btn-primary rounded-2 px-4">
            Back to Design Studio
          </Link>
        </div>
      </div>
    );
  }

  const renderBody = () => {
    if (isGenerating) return <GeneratingView progress={progress} />;

    if (step === "purpose") return <PurposeStep key="purpose" question={question} busy={busy} onSubmit={submitAnswer} />;
    if (step === "color") return <ColorStep key="color" question={question} busy={busy} onSubmit={submitAnswer} />;
    if (step === "content") return <ContentStep key="content" question={question} busy={busy} onSubmit={submitAnswer} />;

    if (step === "generate") {
      const failed = session.status === "failed";
      return (
        <div className="text-center py-4">
          {failed ? (
            <div className="alert alert-danger rounded-2 text-start">
              <div className="fw-semibold mb-1">Your design could not be created</div>
              {session.error || "Something went wrong. Your design credit was not used."}
            </div>
          ) : (
            <>
              <IconSparkles size={44} className="text-primary mb-2" />
              <h4 className="fw-semibold mb-1">Everything is ready</h4>
              <p className="text-muted mb-4">We have all the details. Let&apos;s create your design.</p>
            </>
          )}
          <button
            type="button"
            className="btn btn-primary rounded-2 px-5"
            style={{ paddingBlock: "12px" }}
            disabled={busy}
            onClick={generate}
          >
            {busy ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : <IconSparkles size={18} className="me-2" />}
            {failed ? "Try again" : "Create my design"}
          </button>
        </div>
      );
    }

    if (step === "done") {
      return <DesignResult session={session} usage={usage} busy={busy} onEdit={edit} onDownload={download} />;
    }

    return <Loading />;
  };

  const analysis = session.analysis;
  const showIdea = !isGenerating && step !== "done" && (analysis?.summary || session.input?.prompt);

  return (
    <div>
      <Navbar />

      <div className="container py-4" style={{ marginBottom: "100px" }}>
        {/* Top bar */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <Link to="/design" className="btn btn-link text-decoration-none px-0">
            <IconArrowLeft size={18} className="me-1" />
            All designs
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-2"
            disabled={busy || isGenerating}
            onClick={() => setShowDelete(true)}
          >
            <IconTrash size={16} className="me-1" />
            Delete
          </button>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-8 order-2 order-lg-1">
            <div className="mb-3">
              <Stepper current={currentIndex} />
            </div>

            {showIdea && (
              <div className="ds-idea mb-3">
                <small className="text-muted d-block">Your idea</small>
                <div className="fw-medium">{analysis?.summary || session.input.prompt}</div>
              </div>
            )}

            {inlineError && <div className="alert alert-danger rounded-2">{inlineError.message}</div>}

            <div className="ds-panel">{renderBody()}</div>
          </div>

          <div className="col-12 col-lg-4 order-1 order-lg-2">
            <UsageBadge usage={usage} loading={designLoading} />
          </div>
        </div>
      </div>

      <UpgradeModal show={upgradeOpen} message={specialError?.message} code={specialError?.code} onClose={clearSpecialError} />

      <Modal
        title="Delete design"
        show={showDelete}
        onClose={() => setShowDelete(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowDelete(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger rounded-2" onClick={handleDelete} disabled={busy}>
              <IconTrash size={16} className="me-2" />
              Delete
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">This design and all its versions will be deleted permanently.</p>
      </Modal>
    </div>
  );
};

export default DesignSession;