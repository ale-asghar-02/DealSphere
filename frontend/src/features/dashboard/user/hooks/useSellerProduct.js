import { useState } from "react";
import { toast } from "react-toastify";
import { getFieldErrors, getToastError } from "@/utils/validationErrors";
import { fetchSubscription } from "../../../subscription/store/SubscriptionStore";
import { sellerCreateProduct, sellerReadProducts, sellerUpdateProduct, sellerDeleteProduct, sellerMarkAsSold, sellerUpdateStock, sellerRenewProduct } from "../services/sellerProductAPI";

const useSellerProduct = () => {
  const [productLoading, setProductLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Background reload: no spinner, no toast. Keeps the list and the subscription
  // usage in sync with the server after every change, so no page refresh is needed.
  const syncAll = async () => {
    try {
      const data = await sellerReadProducts();
      setProducts(data.data || []);
    } catch {
      /* keep the current list if the background reload fails */
    }
    fetchSubscription();
  };

  //* ════════════════════════════════════════════════
  //* ── SELLER HOOKS ──
  //* ════════════════════════════════════════════════

  const handleSellerCreateProduct = async (productData) => {
    setProductLoading(true);
    try {
      const data = await sellerCreateProduct(productData);
      toast.success("Product created successfully");
      setProducts((prev) => [data.data, ...prev]);
      fetchSubscription();
      return data;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Something went wrong! Cannot create product"));
      }
      fetchSubscription();
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleSellerReadProducts = async () => {
    setProductLoading(true);
    try {
      const data = await sellerReadProducts();
      setProducts(data.data || []);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch your products"));
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  // Silent reload (used for socket events and after actions)
  const refreshProducts = syncAll;

  const handleSellerUpdateProduct = async (productData, productId) => {
    setProductLoading(true);
    try {
      const data = await sellerUpdateProduct(productData, productId);
      toast.success("Product updated successfully");
      // The update response has no populated category, so reload the real list
      await syncAll();
      return data;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Something went wrong! Cannot update product"));
      }
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleSellerDeleteProduct = async (productId) => {
    setProductLoading(true);
    try {
      const data = await sellerDeleteProduct(productId);
      toast.success("Product deleted successfully");
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, status: "deleted" } : p)));
      syncAll();
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot delete product"));
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleSellerMarkAsSold = async (productId) => {
    setProductLoading(true);
    try {
      const data = await sellerMarkAsSold(productId);
      toast.success("Product marked as sold");
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, ...data.data, category: p.category, subCategory: p.subCategory } : p)));
      syncAll();
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot mark as sold"));
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleSellerUpdateStock = async (productId, stockData) => {
    setProductLoading(true);
    try {
      const data = await sellerUpdateStock(productId, stockData);
      toast.success("Stock updated successfully");
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, ...data.data, category: p.category, subCategory: p.subCategory } : p)));
      syncAll(); // stock 0 => soldout (frees a slot), back in stock => active (uses a slot)
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot update stock"));
      fetchSubscription();
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleSellerRenewProduct = async (productId) => {
    setProductLoading(true);
    try {
      const data = await sellerRenewProduct(productId);
      toast.success("Product renewed successfully");
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, ...data.data, category: p.category, subCategory: p.subCategory } : p)));
      syncAll();
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot renew product"));
      fetchSubscription();
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  return {
    productLoading,
    products,
    fieldErrors,
    setFieldErrors,

    handleSellerCreateProduct,
    handleSellerReadProducts,
    refreshProducts,
    handleSellerUpdateProduct,
    handleSellerDeleteProduct,
    handleSellerMarkAsSold,
    handleSellerUpdateStock,
    handleSellerRenewProduct,
  };
};

export default useSellerProduct;