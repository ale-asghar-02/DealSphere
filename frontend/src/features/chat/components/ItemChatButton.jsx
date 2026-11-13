import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconMessageCircle } from "@tabler/icons-react";

import { useAuth } from "../../auth/hooks/useAuth";

const ItemChatButton = ({ ad, product }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const item = ad || product;

  const itemType = ad
    ? "advertisement"
    : "product";

  const sellerId =
    item?.seller?._id ||
    item?.seller ||
    item?.user?._id ||
    item?.user;

  const handleChatClick = (e) => {
    e.stopPropagation();

    if (!item) return;

    if (!user) {
      toast.error("Please login to continue.");
      return;
    }

    if (
      user._id?.toString() ===
      sellerId?.toString()
    ) {
      toast.error(
        `You cannot chat on your own ${
          itemType === "advertisement"
            ? "advertisement"
            : "product"
        }.`,
      );
      return;
    }

    navigate(
      `/chat/${item._id}?seller=${sellerId}&type=${itemType}`,
    );
  };

  return (
    <button
      type="button"
      className="btn btn-outline-secondary d-flex align-items-center justify-content-center rounded-circle p-0"
      onClick={handleChatClick}
      style={{
        width: "40px",
        height: "40px",
      }}
    >
      <IconMessageCircle
        stroke={1.5}
        size={22}
      />
    </button>
  );
};

export default ItemChatButton;