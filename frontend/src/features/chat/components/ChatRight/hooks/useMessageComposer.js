import { useCallback, useEffect, useRef, useState } from "react";

import { useChatData } from "../../../ChatContext";
import { useTyping } from "../../../hooks/useTyping";

// Everything about writing a message: text, image, editing an existing message,
// send / edit / thumbs-up. Used by ChatInputBar; startEdit is also called from the message menu.
export const useMessageComposer = (chatId) => {
  const { handleSendMessage, handleEditMessage, handleEditAIMessage } = useChatData();
  const { emitTyping } = useTyping(chatId);

  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null); // { id, isAIReply }

  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  // fresh composer on chat switch
  useEffect(() => {
    setEditingMsg(null);
    setInput("");
    removeImage();
  }, [chatId, removeImage]);

  const selectImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const startEdit = (msg, isAIReply) => {
    setEditingMsg({ id: msg._id, isAIReply });
    setInput(msg.text || "");
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setInput("");
  };

  const canSend = !!(input.trim() || imageFile);

  const send = async () => {
    if (!canSend) return;
    const text = input.trim();

    if (editingMsg) {
      if (editingMsg.isAIReply) await handleEditAIMessage({ messageId: editingMsg.id, text });
      else await handleEditMessage({ chatId, messageId: editingMsg.id, text });
      setEditingMsg(null);
      setInput("");
      return;
    }

    await handleSendMessage({ chatId, text, image: imageFile });
    setInput("");
    removeImage();
  };

  const sendThumbsUp = () => handleSendMessage({ chatId, text: "👍" });

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return {
    input, setInput, imagePreview, editingMsg, canSend,
    inputRef, fileRef, emitTyping,
    selectImage, removeImage, startEdit, cancelEdit, send, sendThumbsUp, onKeyDown,
  };
};
