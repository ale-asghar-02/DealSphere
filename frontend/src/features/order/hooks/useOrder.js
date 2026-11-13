import { useState } from "react"
import { toast } from "react-toastify";
import { buyNow, checkoutFromCart, getMyOrders, getOrderById, cancelOrder, abandonOrder, confirmReceipt, verifyCodOrder, deleteMyOrder, deleteAllMyOrders, getSellerOrders, getSellerOrderById, updateOrderStatus, deleteSellerOrder, deleteAllSellerOrders } from "../services/orderAPI";
import { getToastError } from "@/utils/validationErrors";

const useOrder = () => {
  const [orderLoading, setOrderLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);

  // ─────────────── BUYER ───────────────

  const handleBuyNow = async (payload) => {
    setOrderLoading(true);
    try {
      const data = await buyNow(payload);
      // stripe wale case me checkoutUrl aata hai (redirect hoga), cod me turant order confirm hota hai
      if (data.checkoutUrl) {
        toast.success("Redirecting to payment...");
      } else {
        toast.success("Order placed successfully");
      }
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot place order");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleCheckoutFromCart = async (payload) => {
    setOrderLoading(true);
    try {
      const data = await checkoutFromCart(payload);
      if (data.checkoutUrl) {
        toast.success("Redirecting to payment...");
      } else {
        toast.success("Order placed successfully");
      }
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot checkout cart");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleGetMyOrders = async () => {
    setOrderLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(data.data);
      return true;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot fetch orders");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleGetOrderById = async (orderId) => {
    setOrderLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data.data);
      return true;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot fetch order");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleCancelOrder = async (orderId, cancelReason) => {
    setOrderLoading(true);
    try {
      const data = await cancelOrder(orderId, cancelReason);
      toast.success("Order cancelled successfully");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot cancel order");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleAbandonOrder = async (orderId) => {
    try {
      await abandonOrder(orderId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    setOrderLoading(true);
    try {
      const data = await confirmReceipt(orderId);
      toast.success("Delivery confirmed! Payment released to seller.");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot confirm receipt");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleVerifyCodOrder = async (orderId) => {
    setOrderLoading(true);
    try {
      return await verifyCodOrder(orderId);
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot load order details");
      return null;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDeleteMyOrder = async (orderId) => {
    setOrderLoading(true);
    try {
      const data = await deleteMyOrder(orderId);
      toast.success("Order removed");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot delete order");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDeleteAllMyOrders = async () => {
    setOrderLoading(true);
    try {
      const data = await deleteAllMyOrders();
      toast.success("All orders removed");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot delete orders");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  // ─────────────── SELLER ───────────────

  const handleGetSellerOrders = async () => {
    setOrderLoading(true);
    try {
      const data = await getSellerOrders();
      setOrders(data.data);
      return true;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot fetch seller orders");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleGetSellerOrderById = async (orderId) => {
    setOrderLoading(true);
    try {
      const data = await getSellerOrderById(orderId);
      setOrder(data.data);
      return true;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot fetch order");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, orderStatus) => {
    setOrderLoading(true);
    try {
      const data = await updateOrderStatus(orderId, orderStatus);
      toast.success(`Order status updated to "${orderStatus}"`);
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot update order status");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDeleteSellerOrder = async (orderId) => {
    setOrderLoading(true);
    try {
      const data = await deleteSellerOrder(orderId);
      toast.success("Order removed");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot delete order");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDeleteAllSellerOrders = async () => {
    setOrderLoading(true);
    try {
      const data = await deleteAllSellerOrders();
      toast.success("All orders removed");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot delete orders");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  return {
    orderLoading,
    orders,
    order,

    // buyer
    handleBuyNow,
    handleCheckoutFromCart,
    handleGetMyOrders,
    handleGetOrderById,
    handleCancelOrder,
    handleAbandonOrder,
    handleConfirmReceipt,
    handleVerifyCodOrder,
    handleDeleteMyOrder,
    handleDeleteAllMyOrders,
    
    // seller
    handleGetSellerOrders,
    handleGetSellerOrderById,
    handleUpdateOrderStatus,
    handleDeleteSellerOrder,
    handleDeleteAllSellerOrders,
  };
};

export default useOrder;