import React from "react";

import { Shimmer } from "@/components/Shimmer";

// loading rows ki widths (thodi alag alag, natural look ke liye)
const SKELETON_WIDTHS = ["55%", "70%", "45%", "65%", "50%"];

const SubCategoryItems = ({ subCategory, selectedSub, setSelectedSub, catLoading }) => {
  return (
    <div className="col-12 mb-3 mb-lg-4">
      <h5 className="mb-3">Categories</h5>
      <div className="col-12">
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="radioDefault"
            id="radioDefault1"
            checked={selectedSub === ""}
            onChange={() => setSelectedSub("")}
          />
          <label className="form-check-label" htmlFor="radioDefault1">All</label>
        </div>

        {catLoading ? (
          // loading: radio + label ki jagah shimmer rows
          SKELETON_WIDTHS.map((width, i) => (
            <div key={i} className="d-flex align-items-center gap-2 mt-2">
              <Shimmer width="16px" height="16px" rounded="rounded-circle" className="flex-shrink-0" />
              <Shimmer width={width} height="16px" />
            </div>
          ))
        ) : subCategory.length > 0 ? (
          subCategory.map((sub, index) => (
            <div key={sub._id} className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="radioDefault"
                id={`radioSub${index}`}
                checked={selectedSub === sub.slug}
                onChange={() => setSelectedSub(sub.slug)}
              />
              <label className="form-check-label" htmlFor={`radioSub${index}`}>{sub.name}</label>
            </div>
          ))
        ) : (
          <p>No subcategories found.</p>
        )}
      </div>
    </div>
  );
};

export default SubCategoryItems;