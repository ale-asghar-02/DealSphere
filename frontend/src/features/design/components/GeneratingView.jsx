import React, { useEffect, useState } from "react";
import { IconSparkles } from "@tabler/icons-react";

const TIPS = [
  "Your design is created with the exact text you gave us.",
  "You can change colors, text or layout afterwards just by typing.",
  "This usually takes 20 to 60 seconds.",
  "You can leave this page. We will notify you when it is ready.",
];

const STAGE_TEXT = {
  starting: "Getting started...",
  creating: "Creating your design...",
  editing: "Applying your change...",
  saving: "Finishing touches...",
};

/**
 * Design banne ya edit hone ke dauran dikhta hai.
 *   progress: { stage, message } (socket se aata hai)
 */
const GeneratingView = ({ progress }) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const message = progress?.message || STAGE_TEXT[progress?.stage] || "Creating your design...";

  return (
    <div className="ds-generating" role="status" aria-live="polite">
      <div className="ds-orb">
        <IconSparkles size={36} />
      </div>
      <h4 className="fw-semibold mb-2">{message}</h4>
      <div className="ds-dots mb-3" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="text-muted mb-0">{TIPS[tipIndex]}</p>
    </div>
  );
};

export default GeneratingView;