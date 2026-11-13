import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { adminReadProducts, adminReadProductById, adminApproveProduct, adminRejectProduct, adminDeleteProduct, adminBanProduct, adminUnbanProduct } from "../services/productModerationAPI";

const useProductModeration = () => {
  const [productLoading, setProductLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAdminReadProducts = async () => {
    setProductLoading(true);
    try {
      const data = await adminReadProducts();
      setProducts(data.data || []);
      return data;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot fetch products"),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleAdminReadProductById = async (productId) => {
    setProductLoading(true);
    try {
      const data = await adminReadProductById(productId);
      setSelectedProduct(data.data || null);
      return data;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot fetch product"),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleAdminApproveProduct = async (productId) => {
    setProductLoading(true);
    try {
      const data = await adminApproveProduct(productId);
      toast.success("Product approved successfully");
      setProducts((prev) => prev.map((p) => (p._id === productId ? data.data : p)));
      return data;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot approve product"),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleAdminRejectProduct = async (productId) => {
    setProductLoading(true);
    try {
      const data = await adminRejectProduct(productId);
      toast.success("Product rejected successfully");
      setProducts((prev) => prev.map((p) => (p._id === productId ? data.data : p)));
      return data;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot reject product"),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleAdminDeleteProduct = async (productId) => {
    setProductLoading(true);
    try {
      const data = await adminDeleteProduct(productId);
      toast.success("Product deleted successfully");
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      return data;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot delete product"),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleAdminBanProduct = async (productId) => {
    setProductLoading(true);
    try {
      const data = await adminBanProduct(productId);
      toast.success("Product banned successfully");
      setProducts((prev) => prev.map((p) => (p._id === productId ? data.data : p)));
      return data;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot ban product"),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleAdminUnbanProduct = async (productId) => {
    setProductLoading(true);
    try {
      const data = await adminUnbanProduct(productId);
      toast.success("Product unbanned successfully");
      setProducts((prev) => prev.map((p) => (p._id === productId ? data.data : p)));
      return data;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot unban product"),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  return {
    productLoading,
    products,
    selectedProduct,

    handleAdminReadProducts,
    handleAdminReadProductById,
    handleAdminApproveProduct,
    handleAdminRejectProduct,
    handleAdminDeleteProduct,
    handleAdminBanProduct,
    handleAdminUnbanProduct,
  };
};

export default useProductModeration;