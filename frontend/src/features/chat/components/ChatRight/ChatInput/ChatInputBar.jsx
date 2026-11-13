import { IconPencil, IconX, IconPhoto, IconSend2, IconThumbUpFilled, IconLock } from "@tabler/icons-react";

// Bottom section: "editing" banner, image preview, text input and send / thumbs-up.
// All state and handlers come from useMessageComposer (passed in as `composer`).
const ChatInputBar = ({ composer, isAdvertisement, isItemActive, itemStatusLabel, isOtherUnavailable = false }) => {
  const {
    input, setInput, imagePreview, editingMsg, canSend,
    inputRef, fileRef, emitTyping,
    selectImage, removeImage, cancelEdit, send, sendThumbsUp, onKeyDown,
  } = composer;

  // user unavailable ho ya item active na ho — dono surat mein input band
  const disabled = isOtherUnavailable || !isItemActive;

  // user wala message item wale message se pehle (zyada clear hai)
  const disabledMessage = isOtherUnavailable
    ? "Messaging disabled — This user is no longer available"
    : `Messaging disabled — ${isAdvertisement ? "Ad" : "Product"} is ${itemStatusLabel === "sold" ? "sold" : "currently unavailable"}`;

  return (
    <div className="chat-input-bar border-top bg-white position-relative px-2 px-sm-3 py-2" style={{ minWidth: 0, flexShrink: 0 }}>
      {disabled && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.88)", zIndex: 10 }}>
          <span className="d-flex align-items-center gap-2" style={{ fontSize: "13px", color: "#999" }}><IconLock size={14} /> {disabledMessage}</span>
        </div>
      )}

      {editingMsg && (
        <div className="d-flex align-items-center justify-content-between mb-2 px-2 py-1 rounded" style={{ background: "#fff8e1", borderLeft: "3px solid #f57c00" }}>
          <span className="d-flex align-items-center gap-1" style={{ fontSize: "11px", color: "#f57c00" }}>
            <IconPencil size={12} /> {editingMsg.isAIReply ? "Editing AI reply" : "Editing message"}
          </span>
          <button className="btn btn-sm p-0" onClick={cancelEdit}><IconX size={16} color="#888" /></button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-2 position-relative d-inline-block">
          <img src={imagePreview} style={{ height: "60px", width: "60px", maxWidth: "100%", objectFit: "cover", borderRadius: "8px", display: "block" }} alt="preview" />
          <button className="position-absolute top-0 end-0 btn btn-sm p-0 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "18px", height: "18px", background: "#333", color: "#fff", transform: "translate(40%,-40%)" }} onClick={removeImage}>
            <IconX size={11} />
          </button>
        </div>
      )}

      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
        <button className="btn btn-sm btn-light rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px", border: "1px solid #ddd" }} disabled={disabled} onClick={() => fileRef.current?.click()}>
          <IconPhoto size={16} color="#555" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={selectImage} />

        <input
          ref={inputRef}
          type="text"
          className="chat-input form-control"
          placeholder="Write a message..."
          value={input}
          disabled={disabled}
          onChange={(e) => { setInput(e.target.value); emitTyping(); }}
          onKeyDown={onKeyDown}
          style={{ borderRadius: "20px", fontSize: "14px", border: "1px solid #ddd", flex: "1 1 0", minWidth: 0, width: "auto" }}
        />

        <button className="btn btn-sm d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "36px", height: "36px", background: "#002f34", border: "none" }} disabled={disabled} onClick={canSend ? send : sendThumbsUp}>
          {canSend ? <IconSend2 size={15} color="#fff" /> : <IconThumbUpFilled size={16} color="#fff" />}
        </button>
      </div>
    </div>
  );
};

export default ChatInputBar;