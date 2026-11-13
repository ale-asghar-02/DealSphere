import { createContext, useContext, useEffect } from "react";
import { AuthContext } from "../auth/AuthContext";
import useCart from "./hooks/useCart";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const cart = useCart();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            cart.handleGetCart();   // login hai to fetch karo
        } else {
            cart.resetCartState();  // logged out hai to clear rakho
        }
    }, [user]); // 👈 user change hone par re-run hoga (login/logout dono cover)

    return (
        <CartContext.Provider value={cart}>
            {children}
        </CartContext.Provider>
    )
}

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCartContext must be used within a CartProvider");
    }
    return context;
}