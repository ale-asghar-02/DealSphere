import { useRef } from "react";
import { IconDots, IconPencil, IconTrash, IconTrashX } from "@tabler/icons-react";

import FloatingMenu from "../../common/FloatingMenu";

// Dots button + dropdown next to a message: edit / delete.
// Desktop: the button appears on row hover. Small screens: it is always visible (see chat.scss).
// The dropdown is a FloatingMenu, so it always stays inside the screen.
// onDelete(forEveryone) — AI replies only support one kind of delete (soft-delete for
// everyone), "delete for me" doesn't apply since the seller authored it via AI.
const MessageActionsMenu = ({ msg, isMine, open, onToggle, onClose, onEdit, onDelete }) => {
  const buttonRef = useRef(null);
  const isAIReply = !!msg.isAIReply;

  return (
    <div className={`msg-actions d-flex align-items-center flex-shrink-0 ${open ? "is-open" : ""} ${isMine ? "me-1 order-first" : "ms-1 order-last"}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Message options"
        className="btn btn-sm p-0 d-flex align-items-center justify-content-center rounded-circle"
        style={{ width: "28px", height: "28px", background: "#fff", border: "1px solid #ddd" }}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
      >
        <IconDots size={14} />
      </button>

      <FloatingMenu open={open} anchorRef={buttonRef} onClose={onClose} align={isMine ? "end" : "start"} minWidth={170}>
        {isMine && !msg.image && (
          <>
            <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-2 px-3" style={{ fontSize: "13px" }} onClick={onEdit}>
              <IconPencil size={14} /> Edit
            </button>
            <div className="dropdown-divider my-0" />
          </>
        )}

        {isAIReply ? (
          <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger" style={{ fontSize: "13px" }} onClick={() => onDelete()}>
            <IconTrash size={14} /> Delete message
          </button>
        ) : (
          <>
            <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger" style={{ fontSize: "13px" }} onClick={() => onDelete(false)}>
              <IconTrash size={14} /> Delete for me
            </button>

            {isMine && (
              <>
                <div className="dropdown-divider my-0" />
                <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger" style={{ fontSize: "13px" }} onClick={() => onDelete(true)}>
                  <IconTrashX size={14} /> Delete for everyone
                </button>
              </>
            )}
          </>
        )}
      </FloatingMenu>
    </div>
  );
};

export default MessageActionsMenu;
