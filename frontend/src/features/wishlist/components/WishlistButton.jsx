import React, { useState, useEffect } from "react";
import { IconHeart } from "@tabler/icons-react";
import { useAuth } from '../../auth/hooks/useAuth'
import useWishlist from "../hooks/useWishlist";

const WishlistButton = ({ ad }) => {
  const { user } = useAuth();
  const { wishlistLoading, handleLikeWishlist, handleUnlikeWishlist, handleGetWishlist } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user || !ad?._id) return;

      const data = await handleGetWishlist();
      if (data && Array.isArray(data)) {
        const exists = data.some((item) => item._id === ad._id);
        setIsWishlisted(exists);
      }
    };

    checkWishlistStatus();
  }, [user, ad?._id]);

  const handleWishlistClick = async () => {
    if (!user) {
      return setIsWishlisted(prev => !prev);
    }

    if (isWishlisted) {
      const success = await handleUnlikeWishlist(ad._id);
      if (success) setIsWishlisted(false);
    } else {
      const success = await handleLikeWishlist(ad._id);
      if (success) setIsWishlisted(true);
    }
  };

  return (
    <div>
      <button
        type="button"
        className={`btn ${isWishlisted ? "btn-danger" : "btn-outline-danger"} d-flex align-items-center justify-content-center rounded-circle p-0`}
        style={{ width: "40px", height: "40px" }}
        onClick={handleWishlistClick}
        disabled={wishlistLoading}
      >
        <IconHeart
          stroke={1.5}
          size={22}
          fill={isWishlisted ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
};

export default WishlistButton;