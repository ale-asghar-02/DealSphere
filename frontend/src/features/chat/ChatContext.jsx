import { createContext, useContext } from "react";

import { useChat } from "./hooks/useChat";

const ChatContext = createContext(null);

// Runs the chat hook ONCE and shares the result with the whole app, so the left
// list, right panel, navbar dot and page all read the same state in realtime.
// Mount it in the app root, inside the Auth and Socket providers.
export const ChatProvider = ({ children }) => {
  const chat = useChat();
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
};

// Use this in every component instead of useChat().
export const useChatData = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatData must be used inside <ChatProvider>");
  return context;
};
