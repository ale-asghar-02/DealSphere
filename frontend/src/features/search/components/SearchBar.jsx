import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IconSearch } from "@tabler/icons-react";
import "../search.scss"

import { getSearchSuggestions } from "../services/searchAPI"; // asal file name ke mutabiq (case!)

const SearchBar = ({ type = "ads", searchPath = "/advertisement", wrapperClassName = "" }) => {
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // URL ka "q" param change ho (reload, direct link, navigate) to input sync ho.
  // page/filters badalne par input ko chhedna nahi, is liye dependency sirf q
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedWrapper = wrapperRef.current && wrapperRef.current.contains(e.target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedWrapper && !clickedDropdown) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    const updateCoords = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      }
    };
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [showDropdown]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (!val.trim() || val.trim().length < 2) {
      clearTimeout(debounceRef.current);
      setResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const data = await getSearchSuggestions(val.trim(), type);
        setResults(data || []);
        setShowDropdown(true);
      } catch (error) {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // Search page par navigate karta hai — query ke sath (page param nahi, 1 se shuru)
  const goToSearchPage = (searchTerm) => {
    const term = searchTerm ?? query;
    if (!term.trim()) return;
    clearTimeout(debounceRef.current);
    setShowDropdown(false);
    navigate(`${searchPath}?q=${encodeURIComponent(term.trim())}`);
  };

  // Dropdown se item click karne par — us item ke title se search page par jaye
const handleItemClick = (item) => {
  clearTimeout(debounceRef.current);
  setShowDropdown(false);

  if (item.kind === "category" && item.slug) {
    navigate(`${searchPath}/${item.slug}`);
    return;
  }

  if (item.kind === "subcategory" && item.slug && item.parentSlug) {
    navigate(`${searchPath}/${item.parentSlug}/${item.slug}`);
    return;
  }

  goToSearchPage(item.title);
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToSearchPage();
    }
  };

  return (
    <div className={`col-12 position-relative mb-2 mb-md-0 ${wrapperClassName}`} ref={wrapperRef}>
      <div className="col-12 rounded-pill border border-dark-subtle ps-5 pe-4 position-relative" style={{ height: '45px' }}>
        <div
          className="position-absolute top-50 start-0 translate-middle"
          style={{ marginLeft: '25px', cursor: 'pointer' }}
          onClick={() => goToSearchPage()}
        >
          <IconSearch size={20} className="text-secondary" />
        </div>
        <input
          type="text"
          className="col-12 h-100 rounded-end-5 border-0 text-truncate"
          style={{ fontSize: '16px', outline: 'none', background: 'transparent' }}
          placeholder={`Search ${type}...`}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
      </div>

      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          className="mt-1 px-2 suggesstion-section"
          style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 1050 }}
        >
          <div className="bg-white border rounded-3 shadow-sm py-2 suggesstions" style={{ height: '50vh', overflowX: 'hidden', overflowY: 'auto' }}>
            {searchLoading && <p className="suggesstion-item">Loading...</p>}

            {!searchLoading && results.length === 0 && (
              <p className="suggesstion-item">No results found</p>
            )}

            {!searchLoading && results.map((item) => (
              <p
                key={`${item.kind}-${item._id}`}
                className="suggesstion-item d-flex align-items-center gap-2"
                onClick={() => handleItemClick(item)}
                style={{ cursor: "pointer" }}
              >
                <IconSearch size={18} className="text-secondary" />
                <span className="text-truncate">{item.title}</span>

                {item.kind === "category" && (
                  <span className="badge bg-light text-dark fw-medium border ms-auto">Category</span>
                )}
                {item.kind === "subcategory" && (
                  <span className="badge bg-light text-dark fw-medium border ms-auto">
                    in {item.parentName}
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchBar;