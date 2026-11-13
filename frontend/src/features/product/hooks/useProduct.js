import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getSearchResults } from "../../search/services/searchApi.js";
import { getAllProduct, getProductsByCategory, getSingleProduct, getRelatedProducts } from "../services/productAPI.js";

const useProduct = () => {
  const [productLoading, setProductLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [relativeProduct, setRelativeProduct] = useState("");

  const handleReadAllProduct = async (filters = {}) => {
    setProductLoading(true);
    try {
      const data = await getAllProduct(filters);
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

  const handleSearchProducts = async (query, filters = {}) => {
    setProductLoading(true);
    try {
      const data = await getSearchResults(query, "products", filters);
      setProducts(data || []);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Cannot search products"));
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  const handleReadProductsByCategory = async (params) => {
    setProductLoading(true);
    try {
      const data = await getProductsByCategory(params);
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

  const handleReadSingleProduct = async (id) => {
    setProductLoading(true);
    try {
      const data = await getSingleProduct(id);
      setProducts(data.data);
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

  const handleReadRelatedProducts = async ({ categoryId, currentId }) => {
    setProductLoading(true);
    try {
      const data = await getRelatedProducts({ categoryId, currentId });
      setRelativeProduct(data.data);
      return data;
    } catch (error) {
      toast.error(
        getToastError(
          error,
          "Something went wrong! Cannot fetch related products",
        ),
      );
      return null;
    } finally {
      setProductLoading(false);
    }
  };

  return {
    productLoading,
    products,
    relativeProduct,
    handleReadAllProduct,
    handleSearchProducts,
    handleReadProductsByCategory,
    handleReadSingleProduct,
    handleReadRelatedProducts,
  };
};

export default useProduct;
