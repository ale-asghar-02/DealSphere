import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { AuthProvider } from "@/features/auth/AuthContext.jsx";
import { CartProvider } from "@/features/cart/CartContext.jsx";
import { SocketProvider } from "@/contexts/SocketContext.jsx";
import { NotificationProvider } from "@/features/notification/NotificationContext.jsx";
import { ChatProvider } from "@/features/chat/ChatContext.jsx";

import ScrollToTop from "@/components/ScrollToTop.jsx";
import App from "@/App.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.scss";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatProvider>

              <ScrollToTop />
              <App />
              <ToastContainer position="bottom-right" />
              
            </ChatProvider>
          </NotificationProvider>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);