import { useEffect, useState } from "react";
import { IconDotsVertical, IconBan, IconLockOpen, IconShieldCheck, IconTrash } from "@tabler/icons-react";

import ReportAction from "@/components/ReportAction";

// "..." dropdown in the top bar: block / report / delete conversation / safety tips.
// Owns only its open state; the actions themselves come from the top bar.
const TopBarMenu = ({ chatId, otherId, isAdvertisement, isBlocked, onBlock, onUnblock, onDeleteConversation, onShowSafetyTips }) => {
  const [open, setOpen] = useState(false);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const run = (action) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="position-relative ms-2 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
      <button
        className="btn btn-sm btn-light rounded-circle"
        style={{ width: "34px", height: "34px", padding: 0 }}
        onMouseDown={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
      >
        <IconDotsVertical size={16} />
      </button>

      {open && (
        <div className="position-absolute bg-white rounded shadow border" style={{ right: 0, top: "40px", zIndex: 200, minWidth: "210px" }} onMouseDown={(e) => e.stopPropagation()}>
          {isBlocked ? (
            <button className="dropdown-item d-flex align-items-center gap-2 py-2 px-3" style={{ fontSize: "13px", color: "#2e7d32" }} onClick={run(onUnblock)}>
              <IconLockOpen size={15} /> Unblock user
            </button>
          ) : (
            <button className="dropdown-item d-flex align-items-center gap-2 py-2 px-3" style={{ fontSize: "13px", color: "#d32f2f" }} onClick={run(onBlock)}>
              <IconBan size={15} /> Block user
            </button>
          )}
          <div className="dropdown-divider my-0" />
          <ReportAction
            reportType="chat"
            chatId={chatId}
            label={isAdvertisement ? "Report this ad" : "Report this product"}
            onTriggerClick={() => setOpen(false)}
          />
          <div className="dropdown-divider my-0" />
          <ReportAction
            reportType="seller"
            targetId={otherId}
            label="Report this user"
            onTriggerClick={() => setOpen(false)}
          />
          <div className="dropdown-divider my-0" />
          <button className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger" style={{ fontSize: "13px" }} onClick={run(onDeleteConversation)}>
            <IconTrash size={15} /> Delete conversation
          </button>
          <div className="dropdown-divider my-0" />
          <button className="dropdown-item d-flex align-items-center gap-2 py-2 px-3" style={{ fontSize: "13px", color: "#f57c00" }} onClick={run(onShowSafetyTips)}>
            <IconShieldCheck size={15} /> Safety tips
          </button>
        </div>
      )}
    </div>
  );
};

export default TopBarMenu;
