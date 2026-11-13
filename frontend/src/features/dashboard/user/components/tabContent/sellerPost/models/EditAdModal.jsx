import { useState, useRef, useEffect } from "react";
import { Country, City } from "country-state-city";
import { IconPlus, IconX } from "@tabler/icons-react";

import useCategory from "../../../../../../category/hooks/useCategory";
import Modal from "@/components/Model";
import { useImageLimit } from "../../../../../../subscription/hooks/useSubscription";
import { getMinPricePkr, isPriceTooLow } from "../../../../store/minPriceHelper";
import { categoryNeedsCondition } from "../../../../store/conditionHelper";

const TITLE_MIN = 10;
const TITLE_MAX = 120;
const DESC_MIN = 30;
const DESC_MAX = 5000;

const EditAdModal = ({ ad, onClose, handleSellerUpdateAd, fieldErrors = {}, setFieldErrors }) => {
  const MIN_IMAGES = 1;
  const MAX_IMAGES = useImageLimit("ad"); // image limit of the seller's current plan

  const { category, subCategory, handleDisplayCategory, handleDisplaySubCategory } = useCategory();

  const initialCategory = ad?.category?._id || ad?.category || "";
  const initialSubCategory = ad?.subCategory?._id || ad?.subCategory || "";

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: ad.title || "",
    description: ad.description || "",
    condition: ad.condition || "",
    price: ad.price || "",
    phoneNumber: ad.phoneNumber || "",
    phoneNumberStatus: ad.phoneNumberStatus === "show",
    country: ad.country || "",
    city: ad.city || "",
    address: ad.address || "",
    category: initialCategory,
    subCategory: initialSubCategory,
  });

  // Pehle se saved category/subCategory state mein hi rakhte hain (condition wipe hone se bachne ke liye)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState(initialSubCategory);

  const clearError = (field) => {
    if (fieldErrors?.[field]) {
      const updated = { ...fieldErrors };
      delete updated[field];
      setFieldErrors?.(updated);
    }
  };

  const setError = (field, message) => setFieldErrors?.((prev) => ({ ...prev, [field]: message }));

  // Condition sirf tab dikhao jab category/subcategory ko iski zaroorat ho.
  // Categories load hone se pehle names nahi hote, us waqt purani condition ko chhedna nahi.
  const selectedCategoryName = category.find((c) => c._id === selectedCategory)?.name;
  const selectedSubCategoryName = subCategory.find((s) => s._id === selectedSubCategory)?.name;
  const namesLoaded = Boolean(selectedCategoryName && selectedSubCategoryName);
  const needsCondition = namesLoaded
    ? categoryNeedsCondition(selectedCategoryName, selectedSubCategoryName)
    : Boolean(formData.condition);

  const initializeEditCategory = async (savedCategoryId, savedSubCategoryId) => {
    await handleDisplayCategory();
    if (savedCategoryId) {
      setSelectedCategory(savedCategoryId);
      await handleDisplaySubCategory(savedCategoryId);
      if (savedSubCategoryId) setSelectedSubCategory(savedSubCategoryId);
    }
  };

  useEffect(() => {
    const categoryId = ad?.category?._id || ad?.category;
    const subCategoryId = ad?.subCategory?._id || ad?.subCategory;
    if (categoryId) initializeEditCategory(categoryId, subCategoryId);
    else handleDisplayCategory();
  }, [ad]);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setSelectedSubCategory("");
    // Category badli hai to purani condition clear, user nayi category ke hisab se dobara chune
    setFormData((prev) => ({ ...prev, category: value, subCategory: "", condition: "" }));
    clearError("category");
    if (value) handleDisplaySubCategory(value);
  };

  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedSubCategory(value);
    setFormData((prev) => ({ ...prev, subCategory: value, condition: "" }));
    clearError("subCategory");
    clearError("condition");
  };

  // ── Minimum price ($0.50 in PKR, live rate) ──
  const [minPrice, setMinPrice] = useState(null);

  useEffect(() => {
    getMinPricePkr().then(setMinPrice);
  }, []);

  const priceTooLow = isPriceTooLow(formData.price, minPrice);

  const [images, setImages] = useState(
    (ad.adsImages || []).map((img) => ({ preview: img.url, isOld: true, data: img }))
  );
  const [removeImages, setRemoveImages] = useState([]);

  useEffect(() => {
    setImages((ad?.adsImages || []).map((img) => ({ preview: img.url, isOld: true, data: img })));
    setRemoveImages([]);
  }, [ad]);

  const [countries] = useState(Country.getAllCountries());
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (!formData.country) return setCities([]);
    const countryObj = countries.find((c) => c.name === formData.country);
    setCities(countryObj ? City.getCitiesOfCountry(countryObj.isoCode) || [] : []);
  }, [formData.country]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setError("adsImages", `Your plan allows a maximum of ${MAX_IMAGES} images per ad`);
      e.target.value = "";
      return;
    }

    const newImages = files.slice(0, remainingSlots).map((file) => ({
      preview: URL.createObjectURL(file),
      isOld: false,
      data: file,
    }));
    setImages((prev) => [...prev, ...newImages]);
    clearError("adsImages");
    e.target.value = "";
  };

  const removeImage = (idx) => {
    const img = images[idx];
    if (img.isOld) setRemoveImages((prev) => [...prev, img.data.public_id]);
    else URL.revokeObjectURL(img.preview);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    clearError("adsImages");
  };

  const handleEmptyBoxClick = () => {
    if (images.length < MAX_IMAGES) fileInputRef.current.click();
  };

  // Backend ke validators jaisi hi checks, taake submit par 400 na aaye
  const validate = () => {
    const errors = {};
    const title = formData.title.trim();
    const description = formData.description.trim();

    if (!formData.category) errors.category = "Category is required";
    if (!formData.subCategory) errors.subCategory = "Sub-category is required";
    if (title.length < TITLE_MIN || title.length > TITLE_MAX)
      errors.title = `Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`;
    if (description.length < DESC_MIN || description.length > DESC_MAX)
      errors.description = `Description must be between ${DESC_MIN} and ${DESC_MAX} characters`;
    if (!formData.country) errors.country = "Country is required";
    if (!formData.city) errors.city = "City is required";
    if (formData.address.trim().length < 5) errors.address = "Address must be at least 5 characters";
    if (!(Number(formData.price) > 0)) errors.price = "Price must be greater than 0";
    else if (priceTooLow) errors.price = `Minimum price is Rs ${minPrice} (approx. $0.50)`;
    if (!/^[0-9]{10,15}$/.test(formData.phoneNumber))
      errors.phoneNumber = "Phone number must be 10 to 15 digits";
    if (needsCondition && !formData.condition) errors.condition = "Condition is required";

    if (images.length < MIN_IMAGES) errors.adsImages = `At least ${MIN_IMAGES} image is required`;
    // Purani ad mein plan se zyada images ho sakti hain (plan expire hone ke baad)
    else if (MAX_IMAGES && images.length > MAX_IMAGES)
      errors.adsImages = `Your plan allows ${MAX_IMAGES} images per ad. Remove ${
        images.length - MAX_IMAGES
      } image(s) to save.`;

    return errors;
  };

  const isBlocked = ad.isBannedAdvertisement || ad.status === "deleted";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || isBlocked) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors?.(errors);
      return;
    }
    setFieldErrors?.({});

    const payload = new FormData();
    Object.entries({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      // Condition na lagti ho to khali bhejo, taake DB se purani value hat jaye
      condition: needsCondition ? formData.condition : "",
      phoneNumberStatus: formData.phoneNumberStatus ? "show" : "hide",
    }).forEach(([key, value]) => payload.append(key, value));
    payload.append("removeImages", JSON.stringify(removeImages));
    images.forEach((img) => {
      if (!img.isOld) payload.append("adsImages", img.data);
    });

    setSubmitting(true);
    try {
      const result = await handleSellerUpdateAd(payload, ad._id);
      // Saved successfully: close the modal (the list has already refreshed itself)
      if (result) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={true}
      onClose={onClose}
      title="Update Ad"
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="submit"
            form="edit-ad-form"
            className="btn btn-primary"
            disabled={submitting || isBlocked}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </>
      }
    >
      <form id="edit-ad-form" className="edit-advertisement-section" onSubmit={handleSubmit}>
        {ad.isBannedAdvertisement && (
          <div className="alert alert-danger py-2">
            This ad has been banned and cannot be updated.
          </div>
        )}

        {/* Moderation result (rejected / pending) seller ko dikhao */}
        {!ad.isBannedAdvertisement && ad.moderationReason && ["rejected", "pending"].includes(ad.status) && (
          <div className={`alert py-2 ${ad.status === "rejected" ? "alert-danger" : "alert-warning"}`}>
            <strong>{ad.status === "rejected" ? "Rejected: " : "Under review: "}</strong>
            {ad.moderationReason}
            {ad.moderationSuggestions?.length > 0 && (
              <ul className="mb-0 mt-1 small">
                {ad.moderationSuggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="alert alert-info py-2 small">
          After saving, your ad goes back to <strong>pending</strong> and will be re-checked before it is live again.
        </div>

        <div className="col-12 d-flex flex-wrap align-items-center gap-3 mb-3">
          <h5 className="col-12 col-md-2">Category</h5>
          <div className="col-12 col-md-4">
            <select
              className={`form-select py-3 ${fieldErrors?.category ? "is-invalid" : ""}`}
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">Select Category</option>
              {category.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors?.category && <div className="invalid-feedback d-block">{fieldErrors.category}</div>}
          </div>
          <div className="col-12 col-md-4">
            <select
              className={`form-select py-3 ${fieldErrors?.subCategory ? "is-invalid" : ""}`}
              value={selectedSubCategory}
              onChange={handleSubCategoryChange}
              disabled={!formData.category}
            >
              <option value="">Select SubCategory</option>
              {subCategory.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
            {fieldErrors?.subCategory && (
              <div className="invalid-feedback d-block">{fieldErrors.subCategory}</div>
            )}
          </div>
        </div>

        <div className="col-12 d-flex flex-wrap align-items-center gap-2 mb-3">
          <h5 className="col-12 col-md-2">Images</h5>
          {images.map((image, idx) => (
            <div key={idx} className="image-slot">
              <img src={image.preview} alt={`preview ${idx}`} />
              <button
                type="button"
                className="btn btn-dark remove-btn"
                style={{ width: "22px", height: "23px" }}
                onClick={() => removeImage(idx)}
              >
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
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
          <div className="col-12">
            <small
              className={images.length < MIN_IMAGES || images.length > MAX_IMAGES ? "text-danger" : "text-success"}
            >
              {images.length}/{MAX_IMAGES} images (your plan's limit) — minimum {MIN_IMAGES} required
            </small>
            {fieldErrors?.adsImages && <div className="text-danger small">{fieldErrors.adsImages}</div>}
          </div>
        </div>

        <div className="row g-2">
          <div className={`col-12 ${needsCondition ? "col-lg-6" : ""}`}>
            <label className="form-label">Title</label>
            <input
              type="text"
              maxLength={TITLE_MAX}
              className={`form-control ${fieldErrors?.title ? "is-invalid" : ""}`}
              placeholder="Title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
            <div className="d-flex justify-content-between mt-1">
              {fieldErrors?.title && <small className="text-danger">{fieldErrors.title}</small>}
              <small className="text-muted ms-auto">
                {formData.title.length}/{TITLE_MAX} (min {TITLE_MIN})
              </small>
            </div>
          </div>

          {needsCondition && (
            <div className="col-12 col-lg-6">
              <label className="form-label">Condition</label>
              <select
                className={`form-select py-3 ${fieldErrors?.condition ? "is-invalid" : ""}`}
                value={formData.condition}
                onChange={(e) => handleChange("condition", e.target.value)}
              >
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Open Box">Open Box</option>
              </select>
              {fieldErrors?.condition && <div className="invalid-feedback d-block">{fieldErrors.condition}</div>}
            </div>
          )}

          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea
              className={`form-control ${fieldErrors?.description ? "is-invalid" : ""}`}
              maxLength={DESC_MAX}
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            ></textarea>
            <div className="d-flex justify-content-between mt-1">
              {fieldErrors?.description && <small className="text-danger">{fieldErrors.description}</small>}
              <small className="text-muted ms-auto">
                {formData.description.length}/{DESC_MAX} (min {DESC_MIN})
              </small>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label">Country</label>
            <select
              className={`form-select py-3 ${fieldErrors?.country ? "is-invalid" : ""}`}
              value={formData.country}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, country: e.target.value, city: "" }));
                clearError("country");
              }}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.isoCode} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors?.country && <div className="invalid-feedback d-block">{fieldErrors.country}</div>}
          </div>
          <div className="col-12 col-lg-6">
            <label className="form-label">City</label>
            <select
              className={`form-select py-3 ${fieldErrors?.city ? "is-invalid" : ""}`}
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              disabled={!formData.country}
            >
              <option value="">Select City</option>
              {/* Purani ad ki city list mein na ho to bhi dikhe */}
              {formData.city && !cities.some((c) => c.name === formData.city) && (
                <option value={formData.city}>{formData.city}</option>
              )}
              {cities.map((c, i) => (
                <option key={`${c.name}-${i}`} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors?.city && <div className="invalid-feedback d-block">{fieldErrors.city}</div>}
          </div>

          <div className="col-12">
            <label className="form-label">Location / Area</label>
            <input
              type="text"
              className={`form-control ${fieldErrors?.address ? "is-invalid" : ""}`}
              placeholder="e.g. DHA, Gulberg"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
            {fieldErrors?.address && <small className="text-danger">{fieldErrors.address}</small>}
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label">Price</label>
            <div className="position-relative">
              <span
                className="position-absolute top-50 start-0 translate-middle-y ps-3 text-dark"
                style={{ pointerEvents: "none" }}
              >
                Rs
              </span>
              <input
                type="number"
                className={`form-control ps-5 ${fieldErrors?.price || priceTooLow ? "is-invalid" : ""}`}
                min={minPrice || 0}
                step="1"
                value={formData.price}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                onChange={(e) => handleChange("price", e.target.value)}
              />
            </div>
            {fieldErrors?.price ? (
              <small className="text-danger">{fieldErrors.price}</small>
            ) : priceTooLow ? (
              <small className="text-danger">Minimum price is Rs {minPrice} (approx. $0.50)</small>
            ) : minPrice ? (
              <small className="text-muted">Minimum price: Rs {minPrice} (approx. $0.50)</small>
            ) : null}
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label">Phone No.</label>
            <div className="position-relative">
              <span
                className="position-absolute top-50 start-0 translate-middle-y ps-2 text-dark"
                style={{ pointerEvents: "none" }}
              >
                +92
              </span>
              <input
                type="tel"
                inputMode="numeric"
                className={`form-control ps-5 ${fieldErrors?.phoneNumber ? "is-invalid" : ""}`}
                placeholder="3001234567"
                maxLength={15}
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {fieldErrors?.phoneNumber && <small className="text-danger">{fieldErrors.phoneNumber}</small>}
          </div>
        </div>

        <div className="d-flex align-items-center mt-3">
          <p className="mb-0 text-body-secondary">Show phone number in ads</p>
          <div className="form-check form-switch ms-3">
            <input
              className="form-check-input fs-5"
              type="checkbox"
              role="switch"
              checked={formData.phoneNumberStatus}
              onChange={(e) => handleChange("phoneNumberStatus", e.target.checked)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditAdModal;