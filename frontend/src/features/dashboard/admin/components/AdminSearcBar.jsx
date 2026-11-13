import { useState, useRef } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";

const AdminSearchBar = ({ type, onSearch, onClear, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const debounceRef = useRef(null);

  const onChange = (e) => {
    const value = e.target.value;

    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Empty search
    if (!value.trim()) {
      if (onClear) {
        onClear();
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(value);
      }
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchTerm("");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (onClear) {
      onClear();
    }
  };

  return (
    <div
      className="position-relative"
      style={{
        width: "350px",
        maxWidth: "100%",
      }}
    >
      <div className="position-relative input-group input-group-sm">
        <input
          type="text"
          className="form-control form-control-sm rounded-1"
          style={{
            paddingLeft: "30px",
            paddingRight: searchTerm ? "34px" : undefined,
            paddingBlock: "8px",
          }}
          placeholder={placeholder || `Search ${type}...`}
          value={searchTerm}
          onChange={onChange}
        />

        <span
          className="position-absolute start-0 ms-2"
          style={{
            zIndex: "999",
            marginTop: "6px",
          }}
        >
          <IconSearch size={16} stroke={1.5} className="text-muted" />
        </span>

        {searchTerm && (
          <button
            type="button"
            className="btn btn-sm position-absolute end-0 top-50 translate-middle-y d-flex align-items-center justify-content-center border-0 bg-transparent text-muted p-0 me-2"
            style={{
              zIndex: 10,
              width: 24,
              height: 24,
            }}
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClearSearch}
          >
            <IconX size={16} stroke={1.5} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminSearchBar;