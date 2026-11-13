import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as TablerIcons from "@tabler/icons-react";

import Modal from "@/components/Model";
import useCategory from "../../../../category/hooks/useCategory";
import SellerPostList from "./sellerPost/SellerPostList";

const SellerAddPost = () => {
  const navigate = useNavigate();
  const { handleDisplayCategory, handleDisplaySubCategory } = useCategory();

  const [typeFilter, setTypeFilter] = useState("ads");
  const [statusFilter, setStatusFilter] = useState(""); 

  const statusTabs = ["active", "pending", "sold", "expired", "rejected", "deleted"];

  // Categories Selectitem
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);

  // ✅ Modal open/close state
  const [showChooseItem, setShowChooseItem] = useState(false);
  const [showCreateAds, setShowCreateAds] = useState(false);

  // ✅ Race condition guard
  const requestIdRef = useRef(0);

  // ✅ Load parent categories
  useEffect(() => {
    const loadCategories = async () => {
      const data = await handleDisplayCategory();
      if (data) setCategories(data.parents);
    };
    loadCategories();
  }, []);

  // ✅ Parent click → load subcategories
  const handleCategoryClick = async (item) => {
    setSelectedCategory(item);
    setSelectedSubcategory(null);
    setSubcategories([]); // turant purani list clear karo
    setSubCategoryLoading(true);

    const currentRequestId = ++requestIdRef.current;

    const data = await handleDisplaySubCategory(item._id);

    // Sirf latest request ka response set karo
    if (currentRequestId === requestIdRef.current) {
      if (data) setSubcategories(data.subcategories);
      setSubCategoryLoading(false);
    }
  };

  // ✅ Subcategory click → navigate
  const handleSubcategoryClick = (sub) => {
    setSelectedSubcategory(sub);
  };

  // ✅ chooseItem close, createAds open
  const openCreateAdsModal = () => {
    setShowChooseItem(false);
    setShowCreateAds(true);
  };

  const handleAddCategory = () => {
    if (!selectedCategory || !selectedSubcategory) {
      toast.error("Please select category and subcategory");
      return;
    }

    setShowCreateAds(false);

    setTimeout(() => {
      navigate("/user/dashboard/create/ads", {
        state: {
          category: selectedCategory,
          subcategory: selectedSubcategory,
        },
      });
    }, 300);
  };

  const handleCreateProduct = () => {
    setShowChooseItem(false);

    setTimeout(() => {
      navigate("/user/dashboard/create/product", {});
    }, 300);
  };

  return (
    <div className="user-add-post">
      <div className="col-12 mb-3">
        <h1 className="fs-5">My Listings</h1>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 'fit-content' }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setStatusFilter(""); // type badalte hi status reset
              }}
            >
              <option value="ads">Ads</option>
              <option value="products">Products</option>
            </select>

            <select
              className="form-select form-select-sm d-flex d-sm-none"
              style={{ width: 'fit-content' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {statusTabs.map(tab => (
                <option key={tab} value={tab}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="d-none d-sm-flex flex-wrap gap-2 align-items-center">
            {statusTabs.map(tab => (
              <button
                key={tab}
                className={`btn btn-sm ${
                  statusFilter === tab
                    ? "btn-primary text-white"
                    : "btn-outline-secondary"
                }`}
                style={{ textTransform: "capitalize" }}
                onClick={() => setStatusFilter(statusFilter === tab ? "" : tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-outline-primary btn-sm" onClick={() => setShowChooseItem(true)} style={{ whiteSpace: 'nowrap' }}>
          Add Item
        </button>
      </div>

      <SellerPostList typeFilter={typeFilter} statusFilter={statusFilter} />
    
      {/* Modal 1 — Choose Item */}
      <Modal
        title="Choose Item"
        show={showChooseItem}
        onClose={() => setShowChooseItem(false)}
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setShowChooseItem(false)}>
            Close
          </button>
        }
      >
        <div className="d-flex align-items-center justify-content-center gap-3 px-0 py-5">
          <button type="button" className="col col-lg-4 btn btn-outline-dark py-3" onClick={openCreateAdsModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-card-heading" viewBox="0 0 16 16">
              <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"/>
              <path d="M3 8.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m0-5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"/>
            </svg>
            <p className="mb-0 px-3">Create Ads</p>
          </button>
          <button type="button" className="col col-lg-4 btn btn-outline-dark py-3" onClick={handleCreateProduct}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-archive" viewBox="0 0 16 16">
              <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
            </svg>
            <p className="mb-0">Create Product</p>
          </button>
        </div>
      </Modal>

      {/* Modal 2 — Choose Category */}
      <Modal
        title="Choose a Category"
        show={showCreateAds}
        onClose={() => setShowCreateAds(false)}
        size="xl"
        staticBackdrop
        footer={
          <>
            <button type="button" className="btn btn-secondary" style={{ paddingBlock: "10px" }} onClick={() => setShowCreateAds(false)}>
              Close
            </button>
            <button type="button" className="btn btn-primary" style={{ paddingBlock: "10px" }} onClick={handleAddCategory}>
              Add Category
            </button>
          </>
        }
      >
        <div className="row g-3">
          {categories.map((cat) => {
            const IconComponent = TablerIcons[cat.icon];
            return (
              <div key={cat._id} className="col-6 col-md-4 col-lg-2" onClick={() => handleCategoryClick(cat)} style={{ cursor: "pointer" }}>
                <div className={`card post-category-items p-2 ${selectedCategory?._id === cat._id ? "active" : ""}`}>
                  <div className="mb-2 d-flex justify-content-center">
                    {IconComponent && <IconComponent stroke={1.3} size={22} />}
                  </div>
                  <div className="small modal-title" style={{ WebkitLineClamp: "1" }}> {cat.name}</div>
                </div>
              </div>
            );
          })}

          {subCategoryLoading && (
            <div className="mt-4">
              <p className="text-muted small mb-0">Loading subcategories...</p>
            </div>
          )}

          {!subCategoryLoading && subcategories.length > 0 && (
            <div className="mt-4">
              <div className="row g-2">
                {subcategories.map((sub) => (
                  <div key={sub._id} className="col-6 col-md-4 col-lg-3" onClick={() => handleSubcategoryClick(sub)} style={{ cursor: "pointer" }}>
                    <div className={`card post-subCategory-items text-center d-flex justify-content-center align-items-center p-2 ${selectedSubcategory?._id === sub._id ? "active" : ""}`}>
                      <p className="small mb-0">{sub.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SellerAddPost;