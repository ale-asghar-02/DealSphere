import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconMessageChatbot, IconX, IconSend, IconDotsVertical, IconExternalLink } from "@tabler/icons-react";
import useChatbot from "../hooks/useChatbot";
import { formatTime } from "@/utils/timeAgo";
import "../aiAssistant.scss";

const STORAGE_KEY = "chatbotSessionId";

const QUICK_QUESTIONS = [
  "What is this website about?",
  "How do I contact a seller?",
  "What subscription plans do you offer?",
  "How can I feature my ad?",
];

const renderMessageText = (text) => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const result = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(<span key={key}>{text.slice(lastIndex, match.index)}</span>);
      key += 1;
    }
    result.push(
      <a
        key={key}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="chatbot-link d-inline-flex align-items-center gap-1"
      >
        Open link <IconExternalLink size={13} />
      </a>
    );
    key += 1;
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    result.push(<span key={key}>{text.slice(lastIndex)}</span>);
  }
  return result;
};

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  const scrollRef = useRef(null);
  const windowRef = useRef(null);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);

  const { sessionId, messages, chatbotLoading, handleStartSession, handleSendMessage } = useChatbot();

  useEffect(() => {
    if (open && !initialized) {
      const saved = localStorage.getItem(STORAGE_KEY);
      handleStartSession(saved);
      setInitialized(true);
    }
  }, [open, initialized, handleStartSession]);

  useEffect(() => {
    if (sessionId) localStorage.setItem(STORAGE_KEY, sessionId);
  }, [sessionId]);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatbotLoading, open]);

  // Close 3-dot menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        menuBtnRef.current && !menuBtnRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close chatbot window on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (windowRef.current && !windowRef.current.contains(e.target)) {
        closeChat();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openChat = () => setOpen(true);

  const closeChat = () => {
    setMenuOpen(false);
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 300);
  };

  const onSend = (text = input) => {
    const value = text.trim();
    if (!value || chatbotLoading) return;
    setInput("");
    setMenuOpen(false);
    handleSendMessage(value);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const conversationStartTime = messages.length > 0 ? messages[0].timestamp : null;

  return (
    <>
      {!open && (
        <button
          type="button"
          className="chatbot-fab bg-primary border-0 rounded-circle shadow d-flex align-items-center justify-content-center"
          onClick={openChat}
          aria-label="Open chatbot"
        >
          <IconMessageChatbot size={26} color="#fff" stroke={1.75} />
        </button>
      )}

      {open && (
        <div
          ref={windowRef}
          className={`chatbot-window shadow-lg border rounded-3 bg-white d-flex flex-column ${
            closing ? "chatbot-window-closing" : "chatbot-window-opening"
          }`}>
          
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-3 py-3 bg-body-secondary border-bottom rounded-top-3 position-relative">
            <div className="d-flex align-items-center gap-2">
              <IconMessageChatbot size={22} className="text-primary" stroke={1.75} />
              <span className="fw-medium">Chatbot</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span ref={menuBtnRef}>
                <IconDotsVertical
                  size={20}
                  className="text-secondary"
                  role="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                />
              </span>
              <IconX size={20} className="text-secondary" role="button" onClick={closeChat} />
            </div>

            {menuOpen && (
              <div ref={menuRef} className="chatbot-menu shadow border rounded-2 bg-white">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chatbot-menu-item"
                    onClick={() => onSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="chatbot-body flex-grow-1 px-3 py-2">
            {conversationStartTime && (
              <div className="small text-center py-2 text-secondary">
                {formatTime(conversationStartTime)}
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`d-flex align-items-end gap-2 mb-2 ${
                  m.role === "user" ? "justify-content-end" : "justify-content-start"
                }`}
              >
                <div
                  className={`chatbot-bubble px-3 py-2 rounded-3 ${
                    m.role === "user" ? "bg-primary text-white" : "bg-body-secondary bg-opacity-75 text-dark"
                  }`}
                >
                  {renderMessageText(m.text)}
                </div>
              </div>
            ))}

            {chatbotLoading && (
              <div className="d-flex align-items-center gap-1 ps-1">
                <IconMessageChatbot size={18} className="text-primary" />
                <span className="chatbot-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="d-flex align-items-center gap-2 px-3 py-0 border-top">
            <input
              type="text"
              className="form-control border-0 shadow-none px-1"
              placeholder="Enter your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="button"
              className="btn btn-link p-0 border-0"
              onClick={() => onSend()}
              disabled={chatbotLoading || !input.trim()}
            >
              <IconSend size={22} className="text-primary" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;