import { useState, useRef, useEffect } from "react";
import { IconBell, IconAlertTriangle, IconX, IconRobot, IconBan, IconClock } from "@tabler/icons-react";

import { useChat } from "../../chat/hooks/useChat";

// Bell icon + dropdown panel listing everything the AI has flagged for the
// seller: blocked/moderated buyer messages, daily quota hits, and AI replies
// that said "seller will confirm" (needsSellerAttention). Drop this anywhere
// in the seller's layout (navbar, dashboard header, chat list header).
//
// Pass `onOpenChat={(chatId) => ...}` if you want the "Open chat" button to
// actually navigate/select that chat — otherwise it's just hidden.
const AIEscalationsPanel = ({ onOpenChat }) => {
  const { aiEscalations, dismissAIEscalation } = useChat();
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState("end"); // "end" | "start" | "center"
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bootstrap's position utilities (start-0 / end-0) have no responsive
  // variants, so we track custom breakpoints ourselves and switch classes in JS:
  // >=768px -> end-0, 426-767px -> start-0, <=425px -> centered.
  useEffect(() => {
    const computeAlign = () => {
      const w = window.innerWidth;
      if (w >= 768) return "end";
      if (w > 425) return "start";
      return "center";
    };
    setAlign(computeAlign());
    const handleResize = () => setAlign(computeAlign());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatTime = (ts) => (ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

  const describeEscalation = (item) => {
    if (item.reason === "moderation") {
      return {
        icon: <IconBan size={16} className="text-danger" />,
        title: "Buyer message blocked",
        detail: item.text || "A buyer message was flagged by the moderation filter and not sent to AI.",
      };
    }
    if (item.reason === "quota_exceeded") {
      return {
        icon: <IconClock size={16} className="text-warning" />,
        title: "Daily AI limit reached",
        detail: "Your AI assistant's daily reply limit was hit — this buyer message wasn't auto-replied to.",
      };
    }
    return {
      icon: <IconRobot size={16} className="text-primary" />,
      title: "AI reply needs your input",
      detail: item.message?.text || "The AI wasn't able to fully answer this — please follow up yourself.",
    };
  };

  return (
    <div className="position-relative d-inline-block" ref={wrapperRef}>
      <button
        type="button"
        className="btn btn-sm btn-light rounded-circle position-relative d-flex align-items-center justify-content-center"
        style={{ width: "30px", height: "30px", padding: 0 }}
        onClick={() => setOpen((p) => !p)}
      >
        <IconBell size={15} />
        {aiEscalations.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "9px" }}>
            {aiEscalations.length > 9 ? "9+" : aiEscalations.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`position-absolute ${align === "end" ? "end-0" : align === "start"} mt-2 bg-white border rounded shadow-sm`}
          style={{ width: "340px", maxHeight: "420px", overflowY: "auto", zIndex: 1050 }}
        >
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <span className="fw-semibold small">AI Assistant Alerts</span>
            {aiEscalations.length > 0 && (
              <span className="badge bg-danger-subtle text-danger">{aiEscalations.length}</span>
            )}
          </div>

          {aiEscalations.length === 0 ? (
            <div className="text-center text-muted small py-4 px-3">
              <IconAlertTriangle size={22} className="mb-2 opacity-50" />
              <div>No alerts yet.</div>
            </div>
          ) : (
            [...aiEscalations].reverse().map((item, idx) => {
              const { icon, title, detail } = describeEscalation(item);
              const originalIndex = aiEscalations.length - 1 - idx; // dismissAIEscalation uses index into original array

              return (
                <div key={`${item.chatId}-${item.receivedAt}-${idx}`} className="d-flex gap-2 px-3 py-2 border-bottom">
                  <div className="flex-shrink-0 mt-1">{icon}</div>

                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="fw-semibold small">{title}</span>
                      <span className="text-muted" style={{ fontSize: "10px" }}>{formatTime(item.receivedAt)}</span>
                    </div>
                    <p className="text-muted small mb-2" style={{ wordBreak: "break-word" }}>{detail}</p>

                    <div className="d-flex gap-2">
                      {onOpenChat && item.chatId && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-0 px-2"
                          style={{ fontSize: "11px" }}
                          onClick={() => { onOpenChat(item.chatId); setOpen(false); }}
                        >
                          Open chat
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0 px-2 d-flex align-items-center gap-1"
                        style={{ fontSize: "11px" }}
                        onClick={() => dismissAIEscalation(originalIndex)}
                      >
                        <IconX size={12} /> Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AIEscalationsPanel;