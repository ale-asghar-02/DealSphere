import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Country, City } from "country-state-city";
import { IconFilter, IconArrowLeft } from "@tabler/icons-react";
import "../product.scss";

import useCategory from "@/features/category/hooks/useCategory";
import useInfiniteList from "@/hooks/useInfiniteList";
import { getAllProduct, getProductsByCategory } from "../services/productAPI"; // path check karein
import { getSearchResults } from "@/features/search/services/searchAPI"; // path/case check karein

import Navbar from "@/components/Navbar/Navbar";
import SearchBar from "@/features/search/components/SearchBar";
import ProductCard from "../components/ProductCard";

const LIMIT = 16;

const Product = () => {
  const { categorySlug, subSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);

  const { category, subCategory, catLoading, handleDisplayCategory, handleDisplaySubCategory } = useCategory();

  const searchQuery = searchParams.get("q") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  // search mein default "relevant", warna "new" (backend ke saath match)
  const sort = searchParams.get("sort") || (searchQuery ? "relevant" : "new");
  const selectedCategory = categorySlug || "";
  const selectedSub = subSlug || "";
  const selectedCountry = searchParams.get("country") || "";
  const selectedCity = searchParams.get("city") || "";

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

  const handleCityChange = (e) => updateParam("city", e.target.value);

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

  // ---------- Categories ----------
  useEffect(() => { handleDisplayCategory(); }, []);

  useEffect(() => {
    if (!categorySlug || category.length === 0) return;
    const activeCat = category.find((cat) => cat.slug === categorySlug);
    if (activeCat) handleDisplaySubCategory(activeCat._id);
  }, [categorySlug, category]);

  // ---------- PAGINATION ----------
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
      if (searchQuery) return await getSearchResults(searchQuery, "products", filters);
      if (categorySlug) {
        return await getProductsByCategory({ categorySlug, subCategory: subSlug, ...filters });
      }
      return await getAllProduct(filters);
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

  const handleSelectCategory = (e) => {
    const slug = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("page");
    const query = params.toString();
    const path = slug ? `/products/${slug}` : `/products`;
    navigate(query ? `${path}?${query}` : path);
  };

  const handleSelectSub = (e) => {
    const slug = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("page");
    const query = params.toString();
    const path = slug ? `/products/${categorySlug}/${slug}` : `/products/${categorySlug}`;
    navigate(query ? `${path}?${query}` : path);
  };

  const showEmpty = initialized && !loading && !error && items.length === 0;
  const showEnd = initialized && !loading && !error && !hasMore && items.length > 0;
  const matchedName = meta?.matchedBy === "category" ? meta?.matchedCategory?.name : null;
  const shortQuery = searchQuery.length > 40 ? `${searchQuery.slice(0, 25)}…` : searchQuery;

  return (
    <div style={{ overflowX: "clip" }}>
      <Navbar />
      <div className="container-fluid">
        <div className="d-flex flex-wrap align-items-center py-1 mx-lg-2 mb-2">
          <SearchBar type="products" searchPath="/products" />
        </div>

        <div className="d-md-none mb-2 px-lg-2">
          <button
            className="btn btn-outline-dark d-flex align-items-center gap-1"
            onClick={() => setShowFilter(true)}
          >
            <IconFilter size={18} /> Filter
          </button>
        </div>

        {showFilter && (
          <div className="filter-backdrop d-md-none" onClick={() => setShowFilter(false)}></div>
        )}

        <div className="row g-2 px-lg-2">
          {/* LEFT: sticky filter (desktop pe) */}
          <div className={`col-12 col-md-4 col-lg-5 col-xl-3 filter-panel ${showFilter ? "show" : ""}`}>
            <div className="card p-3 border border-dark-subtle rounded-3">
              <div className="d-flex d-md-none justify-content-end mb-2">
                <button
                  className="btn btn-sm btn-light"
                  aria-label="Close filter"
                  onClick={() => setShowFilter(false)}
                >
                  <IconArrowLeft size={22} />
                </button>
              </div>

              <div className="col-12 mb-3">
                <h5 className="mb-3">Category</h5>
                <select
                  className="form-select border border-body-subtle rounded-3 py-3 px-2 ps-3"
                  aria-label="Select Category"
                  value={selectedCategory}
                  onChange={handleSelectCategory}
                  disabled={catLoading}
                >
                  <option value="">All Categories</option>
                  {category.map((cat) => (
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {selectedCategory && (
                <div className="col-12 mb-3">
                  <h5 className="mb-3">Sub Category</h5>
                  <select
                    className="form-select border border-body-subtle rounded-3 py-3 px-2 ps-3"
                    aria-label="Select Sub Category"
                    value={selectedSub}
                    onChange={handleSelectSub}
                    disabled={catLoading}
                  >
                    <option value="">All</option>
                    {subCategory.map((sub) => (
                      <option key={sub._id} value={sub.slug}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-12 mt-1">
                <h5 className="mb-3">Location</h5>
                <select
                  className="form-select border border-body-subtle rounded-3 py-3 px-2 ps-3 mb-3"
                  aria-label="Select Country"
                  value={selectedCountry}
                  onChange={handleCountryChange}
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
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
                      <option key={city.name} value={city.name}>{city.name}</option>
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

          {/* RIGHT: cards */}
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
                    <>Products</>
                  )}
                  {total != null && <span className="small ms-1">{"("}{total}{")"}</span>}
                </p>
                <div className="col-12 col-md-6 d-flex align-items-center justify-content-end">
                  <p className="mb-0">Short By <span className="mx-2">:</span></p>
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

              <div className="row g-2" style={{ minHeight: "50vh" }}>
                {items.map((item) => (
                  <ProductCard
                    key={item._id}
                    product={item}
                    pageMarker={pageStart(item) || undefined}
                  />
                ))}

                {loading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <ProductCard key={`skeleton-${i}`} product={{}} />
                  ))}

                {showEmpty && (
                  <div className="col-12 text-center text-body-secondary py-4">
                    No product available
                  </div>
                )}

                {error && (
                  <div className="col-12 text-center py-4">
                    <p className="mb-2">Something went wrong while loading products.</p>
                    <button className="btn btn-outline-dark btn-sm" onClick={retry}>
                      Retry
                    </button>
                  </div>
                )}

                {showEnd && (
                  <div className="col-12 text-center text-body-secondary small py-3">
                    You've reached the end
                  </div>
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

export default Product;