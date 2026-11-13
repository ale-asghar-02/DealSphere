import { useState } from "react"
import { toast } from "react-toastify"
import { getToastError } from "@/utils/validationErrors";
import { addToCart, getCart, updateCartItem, removeFromCart, clearCart } from "../services/cartAPI"

const useCart = () => {
    const [cart, setCart] = useState(null);
    const [cartLoading, setCartLoading] = useState(false);

    const handleAddToCart = async ({ productId, quantity }) => {
        setCartLoading(true);
        try {
            const data = await addToCart({ productId, quantity });
            setCart(data.data)
            toast.success('Product added to cart successfully')
            return true
        } catch (error) {
            toast.error(getToastError(error, "Cannot add to cart product"))
            return false
        } finally {
            setCartLoading(false)
        }
    }

    const handleGetCart = async () => {
        setCartLoading(true);
        try {
            const data = await getCart();
            setCart(data.data)
            // backend ne cart se user ke apne products nikal diye hon to batao
            if (data.removedOwnCount > 0) {
                toast.info("Your own products were removed from the cart")
            }
            return true
        } catch (error) {
            toast.error(getToastError(error, "Cannot get cart"))
            return false
        } finally {
            setCartLoading(false)
        }
    }

    const handleUpdateCartItem = async ({ productId, quantity }) => {
        setCartLoading(true);
        try {
            const data = await updateCartItem({ productId, quantity });
            setCart(data.data)
            return true
        } catch (error) {
            toast.error(getToastError(error, "Cannot update cart item"))
            return false
        } finally {
            setCartLoading(false)
        }
    }

    const handleRemoveFromCart = async ({ productId }) => {
        setCartLoading(true);
        try {
            const data = await removeFromCart({ productId });
            setCart(data.data)
            return true
        } catch (error) {
            toast.error(getToastError(error, "Cannot remove product from cart"))
            return false
        } finally {
            setCartLoading(false)
        }
    }

    const handleClearCart = async () => {
        setCartLoading(true);
        try {
            const data = await clearCart();
            setCart(data.data)
            return true
        } catch (error) {
            toast.error(getToastError(error, "Cannot clear cart"))
            return false
        } finally {
            setCartLoading(false)
        }
    }

    // sirf local state reset karega, backend call nahi karega
    const resetCartState = () => {
        setCart(null);
        setCartLoading(false);
    }

    return {
        cart,
        cartLoading,
        handleAddToCart,
        handleGetCart,
        handleUpdateCartItem,
        handleRemoveFromCart,
        handleClearCart,
        resetCartState
    }
}

export default useCart