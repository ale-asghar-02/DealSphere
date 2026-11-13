import { useState } from "react";
import { IconBan } from "@tabler/icons-react";

import MessageBubble from "./MessageBubble";
import MessageActionsMenu from "./MessageActionsMenu";

// One message row. Owns only the open state of its menu.
// (Showing / hiding the dots button is pure CSS: hover on desktop, always visible on small screens.)
const MessageItem = ({ msg, isMine, onStartEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleEdit = () => {
    setMenuOpen(false);
    onStartEdit(msg, !!msg.isAIReply);
  };

  const handleDelete = async (forEveryone) => {
    setMenuOpen(false);
    await onDelete(msg, forEveryone);
  };

  if (msg.isDeleted) {
    return (
      <div className={`d-flex mb-2 ${isMine ? "justify-content-end" : "justify-content-start"}`}>
        <span className="bg-white rounded-2 p-2" style={{ fontSize: "12px", color: "#aaa", fontStyle: "italic" }}>
          <IconBan size={12} className="me-1" /> This message was deleted
        </span>
      </div>
    );
  }

  return (
    <div className={`chat-msg-row d-flex mb-2 align-items-end ${isMine ? "justify-content-end" : "justify-content-start"}`}>
      <MessageActionsMenu
        msg={msg}
        isMine={isMine}
        open={menuOpen}
        onToggle={() => setMenuOpen((p) => !p)}
        onClose={() => setMenuOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <MessageBubble msg={msg} isMine={isMine} />
    </div>
  );
};

export default MessageItem;
