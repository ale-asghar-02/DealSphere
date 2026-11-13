import { useState, useRef, useEffect } from "react";
import { Country, City } from "country-state-city";
import { IconPlus, IconX, IconTrash } from "@tabler/icons-react";

import useCategory from "../../../../../../category/hooks/useCategory";
import Modal from "@/components/Model";
import { useImageLimit } from "../../../../../../subscription/hooks/useSubscription";
import { getMinPricePkr, isPriceTooLow } from "../../../../store/minPriceHelper";

const EditProductModal = ({ product, onClose, handleSellerUpdateProduct, fieldErrors, setFieldErrors }) => {
  const MIN_IMAGES = 1;
  const MAX_IMAGES = useImageLimit("product"); // image limit of the seller's current plan

  const { category, subCategory, handleDisplayCategory, handleDisplaySubCategory } = useCategory();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const initializeEditCategory = async (savedCategoryId, savedSubCategoryId) => {
    await handleDisplayCategory();
    if (savedCategoryId) {
      setSelectedCategory(savedCategoryId);
      await handleDisplaySubCategory(savedCategoryId);
      if (savedSubCategoryId) setSelectedSubCategory(savedSubCategoryId);
    }
  };

  useEffect(() => {
    const categoryId = product?.category?._id || product?.category;
    const subCategoryId = product?.subCategory?._id || product?.subCategory;
    if (categoryId) initializeEditCategory(categoryId, subCategoryId);
    else handleDisplayCategory();
  }, [product]);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setSelectedSubCategory("");
    setFormData((prev) => ({ ...prev, category: value, subCategory: "" }));
    clearError("category");
    if (value) handleDisplaySubCategory(value);
  };

  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedSubCategory(value);
    setFormData((prev) => ({ ...prev, subCategory: value }));
    clearError("subCategory");
  };

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Banned ya deleted product update nahi ho sakta
  const isBlocked = product.isBannedProduct || product.status === "deleted";

  const [formData, setFormData] = useState({
    title: product.title || "",
    description: product.description || "",
    price: product.price || "",
    isPriceNegotiable: product.isPriceNegotiable || false,
    stock: product.stock ?? 0,
    country: product.country || "",
    city: product.city || "",
    category: product.category?._id || product.category || "",
    subCategory: product.subCategory?._id || product.subCategory || "",
    phoneNumber: product.contactInfo?.phoneNumber || "",
    showPhone: product.contactInfo?.showPhone ?? true,
    chatOnly: product.contactInfo?.chatOnly || false,
  });

  // ── Minimum price ($0.50 in PKR, live rate) ──
  const [minPrice, setMinPrice] = useState(null);

  useEffect(() => {
    getMinPricePkr().then(setMinPrice);
  }, []);

  const priceTooLow = isPriceTooLow(formData.price, minPrice);

  const [attributes, setAttributes] = useState(
    product.attributes?.length ? product.attributes : [{ key: "", value: "" }]
  );
  const handleAttributeChange = (idx, field, value) => {
    setAttributes((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  };
  const addAttributeRow = () => setAttributes((prev) => [...prev, { key: "", value: "" }]);
  const removeAttributeRow = (idx) => setAttributes((prev) => prev.filter((_, i) => i !== idx));

  const [images, setImages] = useState(
    (product.productImages || []).map((img) => ({ preview: img.url, isOld: true, data: img }))
  );
  const [removeImages, setRemoveImages] = useState([]);

  useEffect(() => {
    setImages((product?.productImages || []).map((img) => ({ preview: img.url, isOld: true, data: img })));
    setRemoveImages([]);
  }, [product]);

  const [countries] = useState(Country.getAllCountries());
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (!formData.country) return setCities([]);
    const countryObj = countries.find((c) => c.name === formData.country);
    if (countryObj) setCities(City.getCitiesOfCountry(countryObj.isoCode));
  }, [formData.country]);

  const clearError = (field) => {
    if (fieldErrors?.[field]) {
      const updated = { ...fieldErrors };
      delete updated[field];
      setFieldErrors(updated);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        productImages: `Your plan allows a maximum of ${MAX_IMAGES} images per product`,
      }));
      e.target.value = "";
      return;
    }

    const newImages = files.slice(0, remainingSlots).map((file) => ({
      preview: URL.createObjectURL(file),
      isOld: false,
      data: file,
    }));
    setImages((prev) => [...prev, ...newImages]);
    clearError("productImages");
    e.target.value = "";
  };

  const removeImage = (idx) => {
    const img = images[idx];
    if (img.isOld) setRemoveImages((prev) => [...prev, img.data.public_id]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEmptyBoxClick = () => {
    if (images.length < MAX_IMAGES) fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || isBlocked) return;

    if (images.length < MIN_IMAGES) {
      setFieldErrors((prev) => ({ ...prev, productImages: `At least ${MIN_IMAGES} image is required` }));
      return;
    }

    // An older product can have more images than the current plan allows (e.g. after a plan expired)
    if (images.length > MAX_IMAGES) {
      setFieldErrors((prev) => ({
        ...prev,
        productImages: `Your plan allows ${MAX_IMAGES} images per product. Remove ${images.length - MAX_IMAGES} image(s) to save.`,
      }));
      return;
    }

    if (priceTooLow) {
      setFieldErrors((prev) => ({
        ...prev,
        price: `Minimum price is Rs ${minPrice} (approx. $0.50) per item`,
      }));
      return;
    }

    const cleanAttributes = attributes.filter((a) => a.key && a.value);

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("category", formData.category);
    payload.append("subCategory", formData.subCategory);
    payload.append("price", formData.price);
    payload.append("isPriceNegotiable", formData.isPriceNegotiable);
    payload.append("stock", formData.stock);
    payload.append("country", formData.country);
    payload.append("city", formData.city);
    payload.append("contactInfo", JSON.stringify({
      phoneNumber: formData.phoneNumber,
      showPhone: formData.showPhone,
      chatOnly: formData.chatOnly,
    }));
    payload.append("attributes", JSON.stringify(cleanAttributes));
    payload.append("removeImages", JSON.stringify(removeImages));
    images.forEach((img) => { if (!img.isOld) payload.append("productImages", img.data); });

    setSubmitting(true);
    try {
      const result = await handleSellerUpdateProduct(payload, product._id);
      // Saved successfully: close the modal (the list has already refreshed itself)
      if (result) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={true} onClose={onClose} title="Update Product" size="xl"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="submit" form="edit-product-form" className="btn btn-primary" disabled={submitting || isBlocked}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : "Save Changes"}
          </button>
        </>
      }
    >
      <form id="edit-product-form" className="edit-advertisement-section" onSubmit={handleSubmit}>
        {product.isBannedProduct && (
          <div className="alert alert-danger py-2">
            This product has been banned and cannot be updated.
          </div>
        )}

        {/* Moderation result (rejected / pending) seller ko dikhao */}
        {!product.isBannedProduct && product.moderationReason && ["rejected", "pending"].includes(product.status) && (
          <div className={`alert py-2 ${product.status === "rejected" ? "alert-danger" : "alert-warning"}`}>
            <strong>{product.status === "rejected" ? "Rejected: " : "Under review: "}</strong>
            {product.moderationReason}
            {product.moderationSuggestions?.length > 0 && (
              <ul className="mb-0 mt-1 small">
                {product.moderationSuggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="alert alert-info py-2 small">
          After saving, your product goes back to <strong>pending</strong> and will be re-checked before it is live again.
        </div>

        <div className="col-12 d-flex flex-wrap align-items-center gap-3 mb-3">
          <h5 className="col-12 col-md-2">Category</h5>
          <div className="col-12 col-md-4">
            <select className={`form-select py-3 ${fieldErrors?.category ? "is-invalid" : ""}`} value={selectedCategory} onChange={handleCategoryChange}>
              <option value="">Select Category</option>
              {category.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
            {fieldErrors?.category && <div className="invalid-feedback d-block">{fieldErrors.category}</div>}
          </div>
          <div className="col-12 col-md-4">
            <select className={`form-select py-3 ${fieldErrors?.subCategory ? "is-invalid" : ""}`} value={selectedSubCategory} onChange={handleSubCategoryChange} disabled={!formData.category}>
              <option value="">Select SubCategory</option>
              {subCategory.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
            </select>
            {fieldErrors?.subCategory && <div className="invalid-feedback d-block">{fieldErrors.subCategory}</div>}
          </div>
        </div>

        <div className="col-12 d-flex flex-wrap align-items-center gap-2 mb-3">
          <h5 className="col-12 col-md-2">Images</h5>
          {images.map((image, idx) => (
            <div key={idx} className="image-slot">
              <img src={image.preview} alt={`preview ${idx}`} />
              <button type="button" className="btn btn-dark remove-btn" style={{ width: "22px", height: "23px" }} onClick={() => removeImage(idx)}>
                <IconX stroke={1.5} size={12} />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <div style={{ width: "80px", height: "60px" }}>
              <div className="plus-label rounded-1" onClick={handleEmptyBoxClick}>
                <IconPlus stroke={1.5} size={25} />
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUpload} />
          <div className="col-12">
            <small className={images.length < MIN_IMAGES || images.length > MAX_IMAGES ? "text-danger" : "text-success"}>
              {images.length}/{MAX_IMAGES} images (your plan's limit) — minimum {MIN_IMAGES} required
            </small>
            {fieldErrors?.productImages && <div className="text-danger small">{fieldErrors.productImages}</div>}
          </div>
        </div>

        <div className="row g-2">
          <div className="col-12">
            <label className="form-label">Title</label>
            <input type="text" maxLength={120} className={`form-control ${fieldErrors?.title ? "is-invalid" : ""}`} placeholder="Title" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} />
            <div className="d-flex justify-content-between mt-1">
              {fieldErrors?.title && <small className="text-danger">{fieldErrors.title}</small>}
              <small className="text-muted">{formData.title.length}/120 (min 10)</small>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea className={`form-control ${fieldErrors?.description ? "is-invalid" : ""}`} maxLength={5000} rows={4} value={formData.description} onChange={(e) => handleChange("description", e.target.value)}></textarea>
            <div className="d-flex justify-content-between mt-1">
              {fieldErrors?.description && <small className="text-danger">{fieldErrors.description}</small>}
              <small className="text-muted">{formData.description.length}/5000 (min 30)</small>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Attributes</label>
            {attributes.map((attr, idx) => (
              <div key={idx} className="d-flex gap-2 mb-2">
                <input type="text" className="form-control" placeholder="e.g. Condition, Brand, Color" value={attr.key} onChange={(e) => handleAttributeChange(idx, "key", e.target.value)} />
                <input type="text" className="form-control" placeholder="e.g. New, Sony, Red" value={attr.value} onChange={(e) => handleAttributeChange(idx, "value", e.target.value)} />
                <button type="button" className="btn btn-outline-danger" onClick={() => removeAttributeRow(idx)} disabled={attributes.length === 1}>
                  <IconTrash size={18} />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-outline-secondary btn-sm mt-1" onClick={addAttributeRow}>
              <IconPlus size={16} className="me-1" /> Add Attribute
            </button>
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label">Country</label>
            <select className={`form-select py-3 ${fieldErrors?.country ? "is-invalid" : ""}`} value={formData.country} onChange={(e) => { handleChange("country", e.target.value); handleChange("city", ""); }}>
              <option value="">Select Country</option>
              {countries.map((c) => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
            </select>
            {fieldErrors?.country && <div className="invalid-feedback d-block">{fieldErrors.country}</div>}
          </div>
          <div className="col-12 col-lg-6">
            <label className="form-label">City</label>
            <select className={`form-select py-3 ${fieldErrors?.city ? "is-invalid" : ""}`} value={formData.city} onChange={(e) => handleChange("city", e.target.value)} disabled={!formData.country}>
              <option value="">Select City</option>
              {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            {fieldErrors?.city && <div className="invalid-feedback d-block">{fieldErrors.city}</div>}
          </div>

          <div className="col-12">
            <label className="form-label">Price</label>
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-dark" style={{ pointerEvents: "none" }}>Rs</span>
              <input
                type="number"
                className={`form-control ps-5 ${fieldErrors?.price || priceTooLow ? "is-invalid" : ""}`}
                min={minPrice || 0}
                step="1"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
              />
            </div>
            {fieldErrors?.price ? (
              <small className="text-danger">{fieldErrors.price}</small>
            ) : priceTooLow ? (
              <small className="text-danger">Minimum price is Rs {minPrice} (approx. $0.50) per item</small>
            ) : minPrice ? (
              <small className="text-muted">Minimum price: Rs {minPrice} (approx. $0.50) per item</small>
            ) : null}
          </div>

          <div className="col-12 d-flex align-items-center justify-content-between">
            <p className="mb-0 text-body-secondary">Price is negotiable</p>
            <div className="form-check form-switch m-0">
              <input className="form-check-input fs-5" type="checkbox" role="switch" checked={formData.isPriceNegotiable} onChange={(e) => handleChange("isPriceNegotiable", e.target.checked)} />
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Phone No.</label>
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ps-2 text-dark" style={{ pointerEvents: "none" }}>+92</span>
              <input type="tel" className={`form-control ps-5 ${fieldErrors?.phoneNumber ? "is-invalid" : ""}`} placeholder="3001234567" maxLength={15} value={formData.phoneNumber} onChange={(e) => handleChange("phoneNumber", e.target.value)} />
            </div>
            {fieldErrors?.phoneNumber && <small className="text-danger">{fieldErrors.phoneNumber}</small>}
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-3">
          <p className="mb-0 text-body-secondary">Show phone number</p>
          <div className="form-check form-switch ms-3">
            <input className="form-check-input fs-5" type="checkbox" role="switch" checked={formData.showPhone} onChange={(e) => handleChange("showPhone", e.target.checked)} />
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between mt-2">
          <p className="mb-0 text-body-secondary">Buyers can only chat, no calls</p>
          <div className="form-check form-switch ms-3">
            <input className="form-check-input fs-5" type="checkbox" role="switch" checked={formData.chatOnly} onChange={(e) => handleChange("chatOnly", e.target.checked)} />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;