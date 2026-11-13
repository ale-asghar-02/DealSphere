import { useState } from "react"
import { getToastError } from "@/utils/validationErrors";
import { likeAdvertisement, unlikeAdvertisement, getWishlist, clearWishlist } from "../services/wishlistAPI"

const useWishlist = () => {
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlist, setWishlist] = useState('');

    const handleLikeWishlist = async (adId) => {
        setWishlistLoading(true);
        try {
            const data = await likeAdvertisement(adId);
            setWishlist(data.wishlist)
            return true
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot like advertisement")
            return false
        } finally {
            setWishlistLoading(false);
        }
    }

    const handleUnlikeWishlist = async (adId) => {
        setWishlistLoading(true);
        try {
            await unlikeAdvertisement(adId);
            setWishlist((prev) => (prev || []).filter((ad) => ad._id !== adId));
            return true
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot unlike advertisement")
            return false
        } finally {
            setWishlistLoading(false);
        }
    }

    const handleGetWishlist = async () => {
        setWishlistLoading(true);
        try {
            const data = await getWishlist();
            setWishlist(data.ads)
            return data.ads
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot fetch wishlist")
            return false
        } finally {
            setWishlistLoading(false);
        }
    }

    const handleClearWishlist = async () => {
        setWishlistLoading(true);
        try {
            await clearWishlist();
            setWishlist([]);
            return true
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot clear wishlist")
            return false
        } finally {
            setWishlistLoading(false);
        }
    }

    return { wishlist, wishlistLoading, handleLikeWishlist, handleUnlikeWishlist, handleGetWishlist, handleClearWishlist }
}

export default useWishlist;