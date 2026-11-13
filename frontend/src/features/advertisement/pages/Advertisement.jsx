import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Country, City } from "country-state-city";
import { IconFilter, IconArrowLeft } from "@tabler/icons-react";
import '../advertisement.scss'

import useCategory from "@/features/category/hooks/useCategory";
import useInfiniteList from "@/hooks/useInfiniteList";
import { getAllAds, getAllAdsWithCategorySlug } from "../services/advertisementAPI"; // path check karein
import { getSearchResults } from "@/features/search/services/searchAPI"; // path/case check karein

import Navbar from "@/components/Navbar/Navbar";
import SearchBar from '@/features/search/components/SearchBar'
import CategoryItems from "@/features/category/pages/CategoryItems";
import SubCategoryItems from "@/features/category/pages/SubCategoryItems";
import AdvertisementCard from "../components/AdvertisementCard";

const LIMIT = 16;

const Advertisement = () => {
  const { categorySlug, subSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false); // mobile filter drawer toggle

  const { category, subCategory, catLoading, handleDisplayCategory, handleDisplaySubCategory } = useCategory();

  // ---- search query from URL ----
  const searchQuery = searchParams.get("q") || "";

  // ---- filters from URL query params ----
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  // search mein default "relevant", warna "new" (backend ke saath match)
  const sort = searchParams.get("sort") || (searchQuery ? "relevant" : "new");
  const selectedSub = subSlug || "";
  const selectedCountry = searchParams.get("country") || "";
  const selectedCity = searchParams.get("city") || "";

  // ---- country / city data ----
  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(
    () => (selectedCountry ? City.getCitiesOfCountry(selectedCountry) : []),
    [selectedCountry],
  );

  // URL ka ?page=N sirf pehli mount par padhna ha (refresh / back par wahin se shuru)
  const initialPageRef = useRef(
    Math.max(parseInt(searchParams.get("page")) || 1, 1),
  );

  // "page" param ko filters se alag rakha ha, taake sirf page badalne par list reset na ho
  const filterKey = (() => {
    const p = new URLSearchParams(searchParams);
    p.delete("page");
    return p.toString();
  })();

  // ---------- Filters (history mein entries nahi banti: replace) ----------
  const updateParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set(key, value);
        else params.delete(key);
        params.delete("page");
        return params;
      },
      { replace: true },
    );
  };

  // country change -> city reset (city dobara select karni parey gi)
  const handleCountryChange = (e) => {
    const value = e.target.value;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set("country", value);
        else params.delete("country");
        params.delete("city");
        params.delete("page");
        return params;
      },
      { replace: true },
    );
  };

  const handleCityChange = (e) => { updateParam("city", e.target.value) };

  // ---------- Price: local state + debounce ----------
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  useEffect(() => setMinInput(minPrice), [minPrice]);
  useEffect(() => setMaxInput(maxPrice), [maxPrice]);

  useEffect(() => {
    if (minInput === minPrice && maxInput === maxPrice) return;
    const t = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (minInput) p.set("minPrice", minInput);
          else p.delete("minPrice");
          if (maxInput) p.set("maxPrice", maxInput);
          else p.delete("maxPrice");
          p.delete("page");
          return p;
        },
        { replace: true },
      );
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minInput, maxInput]);

  // categories fetch on mount
  useEffect(() => { handleDisplayCategory() }, []);

  // subcategories fetch jab categorySlug change ho
  useEffect(() => {
    if (!categorySlug || category.length === 0) return;
    const activeCat = category.find((cat) => cat.slug === categorySlug);
    if (activeCat) {
      handleDisplaySubCategory(activeCat._id);
    }
  }, [categorySlug, category]);

  // ---------- PAGINATION ----------
  // Priority: 1) search query  2) category selected  3) sab ads
  // seedha API functions, state hook ke andar rehti ha. Error par null.
  const fetcher = async (page, limit) => {
    const filters = {
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      sort: searchParams.get("sort"),
      country: countries.find((c) => c.isoCode === selectedCountry)?.name || "",
      city: selectedCity,
      page,
      limit,
    };

    try {
      if (searchQuery) return await getSearchResults(searchQuery, "ads", filters);
      if (categorySlug) {
        return await getAllAdsWithCategorySlug({ categorySlug, subCategory: subSlug, ...filters });
      }
      return await getAllAds(filters);
    } catch {
      return null;
    }
  };

  const {
    items, total, meta, loading, error, initialized, hasMore,
    currentPage, pageStart, sentinelRef, retry,
  } = useInfiniteList({
    fetcher,
    limit: LIMIT,
    initialPage: initialPageRef.current,
    deps: [categorySlug, subSlug, filterKey],
  });

  // scroll ke saath URL mein ?page=1, ?page=2 ... (replace, history kharab nahi hoti)
  useEffect(() => {
    if (currentPage < 1) return;
    if (searchParams.get("page") === String(currentPage)) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("page", String(currentPage));
        return p;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // subcategory select hone par URL path change (q aur page delete, baqi filters preserve)
  const handleSelectSub = (slug) => {
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("page");
    const query = params.toString();
    const path = slug
      ? `/advertisement/${categorySlug}/${slug}`
      : `/advertisement/${categorySlug}`;
    navigate(query ? `${path}?${query}` : path);
  };

  const showEmpty = initialized && !loading && !error && items.length === 0;
  const showEnd = initialized && !loading && !error && !hasMore && items.length > 0;
  const matchedName = meta?.matchedBy === "category" ? meta?.matchedCategory?.name : null;
  const shortQuery = searchQuery.length > 40 ? `${searchQuery.slice(0, 25)}…` : searchQuery;

  return (
    <div className="advertisement-section" style={{ overflowX: "clip" }}>

      <Navbar />

      <div className="container-fluid d-flex flex-wrap flex-md-nowrap align-items-center py-1 mx-lg-2 mb-2">
        <SearchBar
          type="ads"
          searchPath="/advertisement"
          wrapperClassName="col-md-5 col-lg-4 me-md-2"
        />
        <CategoryItems activeCategorySlug={categorySlug} />
      </div>

      <div className="container-fluid">
        {/* mobile filter open button */}
        <div className="d-md-none mb-2 px-lg-2">
          <button
            className="btn btn-outline-dark d-flex align-items-center gap-1"
            onClick={() => setShowFilter(true)}
          >
            <IconFilter size={18} /> Filter
          </button>
        </div>

        {/* backdrop for mobile drawer */}
        {showFilter && (
          <div
            className="filter-backdrop d-md-none"
            onClick={() => setShowFilter(false)}
          ></div>
        )}

        <div className="row g-2 px-lg-2">
          {/* LEFT: sticky filter (desktop pe) */}
          <div className={`col-12 col-md-4 col-lg-5 col-xl-3 filter-panel ${showFilter ? "show" : ""}`}>
            <div className="card p-3 border border-dark-subtle rounded-3">
              {/* close button, mobile only */}
              <div className="d-flex d-md-none justify-content-end mb-2">
                <button
                  className="btn btn-sm btn-light"
                  aria-label="Close filter"
                  onClick={() => setShowFilter(false)}
                >
                  <IconArrowLeft size={22} />
                </button>
              </div>

              {categorySlug && (
                <SubCategoryItems
                  subCategory={subCategory}
                  selectedSub={selectedSub}
                  setSelectedSub={handleSelectSub}
                  catLoading={catLoading}
                />
              )}

              {/* Country / City filter */}
              <div className="col-12 mt-3">
                <h5 className="mb-3">Location</h5>
                <select
                  className="form-select border border-body-subtle rounded-3 py-3 px-2 ps-3 mb-3"
                  aria-label="Select Country"
                  value={selectedCountry}
                  onChange={handleCountryChange}
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {selectedCountry && (
                  <select
                    className="form-select border border-body-subtle rounded-3 py-3 px-2 ps-3 mb-3"
                    aria-label="Select City"
                    value={selectedCity}
                    onChange={handleCityChange}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="col-12">
                <h5 className="mb-3">Price</h5>
                <div className="d-flex gap-3 align-items-center">
                  <input
                    type="number"
                    className="form-control border border-body-subtle rounded-3"
                    placeholder="Min"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    min={0}
                  />
                  <p className="mb-0">To</p>
                  <input
                    type="number"
                    className="form-control border border-body-subtle rounded-3"
                    placeholder="Max"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: cards, window ke saath scroll */}
          <div className="col-12 col-md-8 col-lg-7 col-xl-9">
            <div className="card p-3 border border-dark-subtle rounded-3">
              <div className="col-12 d-flex flex-wrap align-items-center mb-3">
                <p className="col-12 col-md-6 mb-0">
                  {searchQuery ? (
                    matchedName ? (
                      <>Showing results in "<strong className="fw-medium">{matchedName}</strong>" category</>
                    ) : (
                      <>Search results for "<strong className="fw-medium" title={searchQuery}>{shortQuery}</strong>"</>
                    )
                  ) : (
                    <>Advertisement</>
                  )}
                  {total != null && <span className="small ms-1">{"("}{total}{")"}</span>}
                </p>
                <div className="col-12 col-md-6 d-flex align-items-center justify-content-end">
                  <p className="mb-0">
                    Short By <span className="mx-2">:</span>
                  </p>
                  <select
                    aria-label="Sort by"
                    className="border-0"
                    style={{ width: "140px", outline: "none" }}
                    value={sort}
                    onChange={(e) => updateParam("sort", e.target.value)}
                  >
                    <option value="new">Newly Listed</option>
                    <option value="relevant">Most Relevant</option>
                    <option value="low">Lowest Price</option>
                    <option value="high">Highest Price</option>
                  </select>
                </div>
              </div>

              <div className="col-12" style={{ minHeight: "50vh" }}>
                {items.map((item) => (
                  <AdvertisementCard
                    key={item._id}
                    ad={item}
                    pageMarker={pageStart(item) || undefined}
                  />
                ))}

                {loading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <AdvertisementCard key={`skeleton-${i}`} ad={{}} />
                  ))}

                {showEmpty && (
                  <p className="text-center text-body-secondary py-4">No advertisement available</p>
                )}

                {error && (
                  <div className="text-center py-4">
                    <p className="mb-2">Something went wrong while loading advertisements.</p>
                    <button className="btn btn-outline-dark btn-sm" onClick={retry}>
                      Retry
                    </button>
                  </div>
                )}

                {showEnd && (
                  <p className="text-center text-body-secondary small py-3 mb-0">
                    You've reached the end
                  </p>
                )}

                <div ref={sentinelRef} style={{ height: 1, width: "100%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Advertisement;