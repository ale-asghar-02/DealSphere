import { useState, useEffect, useRef, useCallback } from "react";
import { getToastError } from "@/utils/validationErrors";
import { getSearchSuggestions } from "../services/searchAPI";

const useSearch = (type = "ads") => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  const fetchResults = useCallback(async (value) => {
    if (!value || value.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      setSearchLoading(true);
      const data = await getSearchSuggestions(value, type);
      setResults(data || []);
      setShowDropdown(true);
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot search item");
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, fetchResults]);

  return { query, setQuery, results, searchLoading, showDropdown, setShowDropdown };
};

export default useSearch;