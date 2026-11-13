import { useNavigate } from "react-router-dom";
import { useChatData } from "../ChatContext";

const NavChatIcon = () => {
  const navigate = useNavigate();
  const { totalUnreadCount } = useChatData();

  return (
    <div
      className="cart-link position-relative d-inline-block mt-1"
      style={{ cursor: "pointer" }}
      onClick={() => navigate("/chat")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="currentColor"
        className="text-dark bi bi-chat-right-text"
        viewBox="0 0 16 16"
      >
        <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
        <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6m0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" />
      </svg>

      {totalUnreadCount > 0 && (
        <span
          className="position-absolute top-0 translate-middle p-1 bg-danger border border-light rounded-circle mt-1"
          style={{ right: "-8px" }}
        ></span>
      )}
    </div>
  );
};

export default NavChatIcon;