import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { adminSearch } from "../services/adminSearchAPi";

const useAdminSearch = (type) => {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
 
  const handleSearch = async (query) => {
    if (!query || !query.trim()) {
      setResults([]);
      setTotal(0);
      return true;
    }
 
    setSearchLoading(true);
    try {
      const res = await adminSearch(type, query);
      setResults(res.data);
      setTotal(res.total);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Search failed"));
      return false;
    } finally {
      setSearchLoading(false);
    }
  };
 
  const clearSearch = () => {
    setResults([]);
    setTotal(0);
  };
 
  return {
    results,
    total,
    searchLoading,
    handleSearch,
    clearSearch,
  };
};

export default useAdminSearch;