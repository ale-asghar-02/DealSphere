import { useState, useRef, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Country, City } from "country-state-city";
import * as TablerIcons from "@tabler/icons-react";
import { IconCameraPlus, IconPlus, IconX, IconSearch, IconSparkles } from "@tabler/icons-react";

import { AuthContext } from "../../../auth/AuthContext";
import useSellerAds from "../hooks/useSellerAds";
import useCategory from "@/features/category/hooks/useCategory";
import Navbar from "@/components/Navbar/Navbar";

import AdAutofillModal from "../../../aiAssistant/components/AdAutofillModal";
import { useImageLimit, useListingLimit } from "../../../subscription/hooks/useSubscription";
import ListingLimitBanner from "../../../subscription/components/ListingLimitBanner";
import { getMinPricePkr, isPriceTooLow } from "../store/minPriceHelper";
import { categoryNeedsCondition } from "../store/conditionHelper";

const TITLE_MIN = 10;
const TITLE_MAX = 120;
const DESC_MIN = 30;
const DESC_MAX = 5000;

const EMPTY_FORM = {
  condition: "",
  title: "",
  description: "",
  price: "",
  phoneNumber: "",
  showPhone: true,
};

const CreateAds = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const { adsLoading, fieldErrors, setFieldErrors, handleSellerCreateAd } = useSellerAds();
  const { category: categoryList, handleDisplayCategory, handleDisplaySubCategory } = useCategory();

  // Subscription: image limit of the seller's plan + live ads limit
  const MAX_IMAGES = useImageLimit("ad");
  const { reached: limitReached } = useListingLimit("ad");

  const [showAutofillModal, setShowAutofillModal] = useState(false);

  const [categoryData, setCategoryData] = useState({
    category: routerLocation.state?.category || null,
    subcategory: routerLocation.state?.subcategory || null,
  });

  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const imagesRef = useRef([]);
  imagesRef.current = images;

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [touched, setTouched] = useState({
    title: false,
    description: false,
  });

  const [locationData, setLocationData] = useState({
    country: "",
    cities: [],
    city: "",
    address: "",
  });

  const needsCondition = categoryNeedsCondition(
    categoryData.category?.name,
    categoryData.subcategory?.name
  );

  // Category aisi ho jisme condition nahi chahiye to purani value clear
  useEffect(() => {
    if (!needsCondition) {
      setFormData((prev) => (prev.condition ? { ...prev, condition: "" } : prev));
    }
  }, [needsCondition]);

  // Page chhodte waqt image previews free karo
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => img.preview && URL.revokeObjectURL(img.preview));
    };
  }, []);

  // ── Minimum price ($0.50 in PKR, live rate) ──
  const [minPrice, setMinPrice] = useState(null);

  useEffect(() => {
    getMinPricePkr().then(setMinPrice);
  }, []);

  const priceTooLow = isPriceTooLow(formData.price, minPrice);

  const countries = Country.getAllCountries();
  const CategoryIcon = categoryData.category?.icon ? TablerIcons[categoryData.category.icon] : null;

  const titleLen = formData.title.trim().length;
  const descLen = formData.description.trim().length;

  const isTitleInvalid = touched.title && (titleLen < TITLE_MIN || titleLen > TITLE_MAX);
  const isTitleValid = touched.title && titleLen >= TITLE_MIN && titleLen <= TITLE_MAX;

  const isDescInvalid = touched.description && (descLen < DESC_MIN || descLen > DESC_MAX);
  const isDescValid = touched.description && descLen >= DESC_MIN && descLen <= DESC_MAX;

  // Redirect back if no category/subcategory was passed in
  useEffect(() => {
    if (!routerLocation.state?.category || !routerLocation.state?.subcategory) {
      navigate("/user/dashboard", { replace: true });
    }
  }, [routerLocation.state, navigate]);

  useEffect(() => {
    handleDisplayCategory();
  }, []);

  // Auto-fill location fields from the user's profile (supports a few different profile shapes)
  useEffect(() => {
    if (!user) return;

    let profileCountry = user.country || user.location?.country || "";
    let profileCity = user.city || user.location?.city || "";
    let profileAddress = user.address || user.location?.address || "";

    if (typeof user.location === "string" && !profileCountry && !profileCity) {
      const parts = user.location.split(",").map((p) => p.trim()).filter(Boolean);

      if (parts.length >= 1) profileCountry = parts[parts.length - 1];
      if (parts.length >= 2) profileCity = parts[parts.length - 2];
      if (parts.length >= 3) profileAddress = parts.slice(0, -2).join(", ");
    }

    if (!profileCountry) return;

    const countryObj = countries.find(
      (c) =>
        c.name.toLowerCase().trim() === profileCountry.toLowerCase().trim() ||
        c.isoCode.toLowerCase().trim() === profileCountry.toLowerCase().trim()
    );

    if (!countryObj) return;

    const countryCities = City.getCitiesOfCountry(countryObj.isoCode) || [];
    const cityObj = profileCity
      ? countryCities.find((c) => c.name.toLowerCase().trim() === profileCity.toLowerCase().trim())
      : null;

    setLocationData((prev) => ({
      ...prev,
      country: countryObj.isoCode,
      cities: countryCities,
      city: cityObj ? cityObj.name : profileCity || prev.city,
      address: profileAddress || prev.address,
    }));
  }, [user]);

  const clearError = (field) => setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleEmptyBoxClick = () => fileInputRef.current?.click();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        adsImages: `Your plan allows a maximum of ${MAX_IMAGES} images per ad`,
      }));
      e.target.value = "";
      return;
    }

    const newImages = files.slice(0, remainingSlots).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    clearError("adsImages");
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      if (prev[idx]?.preview) URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleCountryChange = (e) => {
    const isoCode = e.target.value;

    setLocationData((prev) => ({
      ...prev,
      country: isoCode,
      city: "",
      cities: isoCode ? City.getCitiesOfCountry(isoCode) || [] : [],
    }));

    setFieldErrors((prev) => ({ ...prev, country: undefined, city: undefined }));
  };

  const handleCityChange = (e) => {
    setLocationData((prev) => ({ ...prev, city: e.target.value }));
    clearError("city");
  };

  const handleApplyAutofill = async (data) => {
    if (!data) return;

    // Category + subCategory dono mil jayein tabhi badlo, warna current selection rehne do
    // (sirf category bina subCategory ke submit par 400 deta hai)
    let nextCategoryData = null;

    if (data.category && data.subCategory) {
      const catObj = categoryList.find((c) => c._id === data.category);

      if (catObj) {
        const subData = await handleDisplaySubCategory(data.category);
        const subList = Array.isArray(subData) ? subData : subData?.subcategories || [];
        const subObj = subList.find((s) => s._id === data.subCategory) || null;

        if (subObj) nextCategoryData = { category: catObj, subcategory: subObj };
      }
    }

    if (nextCategoryData) setCategoryData(nextCategoryData);

    setFormData((prev) => ({
      ...prev,
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.condition && { condition: data.condition }),
      ...(Number(data.price) > 0 && { price: String(Math.round(Number(data.price))) }),
    }));

    setTouched({ title: Boolean(data.title), description: Boolean(data.description) });
    setFieldErrors({});
  };

  // Backend validators jaisi checks, taake submit par 400 na aaye
  const validate = () => {
    const errors = {};

    if (!categoryData.category?._id) errors.category = "Category is required";
    else if (!categoryData.subcategory?._id) errors.subCategory = "Sub-category is required";

    if (images.length === 0) errors.adsImages = "At least one image is required";
    if (needsCondition && !formData.condition) errors.condition = "Condition is required";

    if (titleLen < TITLE_MIN || titleLen > TITLE_MAX)
      errors.title = `Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`;
    if (descLen < DESC_MIN || descLen > DESC_MAX)
      errors.description = `Description must be between ${DESC_MIN} and ${DESC_MAX} characters`;

    if (!Number(formData.price) || Number(formData.price) <= 0) errors.price = "Price must be greater than 0";
    else if (priceTooLow) errors.price = `Minimum price is Rs ${minPrice} (approx. $0.50)`;

    if (!/^[0-9]{10,15}$/.test(formData.phoneNumber))
      errors.phoneNumber = "Phone number must be 10 to 15 digits";

    if (!locationData.country) errors.country = "Country is required";
    if (!locationData.city) errors.city = "City is required";

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (limitReached || adsLoading) return; // banner already explains the limit
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const countryObj = countries.find((c) => c.isoCode === locationData.country);
    const cityObj = locationData.cities.find((c) => c.name === locationData.city);

    // Backend address kam az kam 5 chars maangta hai, is liye city/country saath jod kar bhejte hain
    const fullAddress = [locationData.address.trim(), cityObj?.name || locationData.city, countryObj?.name]
      .filter(Boolean)
      .join(", ");

    const payload = new FormData();

    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("category", categoryData.category._id);
    payload.append("subCategory", categoryData.subcategory._id);
    // Condition na lagti ho to khali bhejo (backend "" ko "not applicable" maanta hai)
    payload.append("condition", needsCondition ? formData.condition : "");
    payload.append("price", formData.price);
    payload.append("phoneNumber", formData.phoneNumber);
    payload.append("phoneNumberStatus", formData.showPhone ? "show" : "hide");
    payload.append("country", countryObj?.name || "");
    payload.append("city", cityObj?.name || locationData.city || "");
    payload.append("address", fullAddress);

    images.forEach((img) => payload.append("adsImages", img.file));

    const result = await handleSellerCreateAd(payload);
    if (!result) return;

    setFormData(EMPTY_FORM);
    setLocationData({ country: "", cities: [], city: "", address: "" });
    setTouched({ title: false, description: false });

    images.forEach((img) => img.preview && URL.revokeObjectURL(img.preview));
    setImages([]);

    navigate("/user/dashboard");
  };

  return (
    <div className="create-advertisement-section pb-5">
      <Navbar />

      <div className="container-fluid">
        <div className="row px-lg-2">
          <div className="col-12 mb-3">
            <p className="text-body-secondary">
              Home / Dashboard / Create <span className="text-dark">/ Advertisement</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="col-12 d-flex flex-wrap flex-md-nowrap gap-2 pe-md-2">
              <div className="col-12 col-md-8 col-lg-7 col-xl-8">
                {/* Live ads limit of the current plan */}
                <ListingLimitBanner type="ad" className="mb-2" />

                <div className="col-12 border border-light-subtle rounded-3 mb-2">
                  {/* AI Autofill */}
                  <div
                    className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowAutofillModal(true)}
                  >
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">AI Autofill</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9 d-flex align-items-center gap-2">
                      <div className="form-check d-flex align-items-center gap-2">
                        <input
                          className="form-check-input mt-0"
                          type="radio"
                          id="aiAutofillTrigger"
                          checked={showAutofillModal}
                          readOnly
                        />

                        <label
                          className="form-check-label d-flex align-items-center"
                          htmlFor="aiAutofillTrigger"
                          style={{ cursor: "pointer" }}
                        >
                          <IconSparkles size={16} className="me-1" />
                          Let AI generate title, description, category & price for you
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Category</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9 d-flex align-items-center justify-content-between">
                      {categoryData.category && categoryData.subcategory ? (
                        <div className="d-flex flex-wrap align-items-center">
                          <div
                            className="border border-black rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: "65px", height: "65px" }}
                          >
                            {CategoryIcon && <CategoryIcon stroke={1.3} size={28} />}
                          </div>

                          <div>
                            <p className="fs-5 fw-medium mb-0">{categoryData.category.name}</p>
                            <p className="mb-0 text-body-secondary">{categoryData.subcategory.name}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mb-0">No category selected</p>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate("/user/dashboard")}
                      >
                        Change
                      </button>
                    </div>

                    {fieldErrors.category && (
                      <small className="text-danger w-100 mt-1">{fieldErrors.category}</small>
                    )}
                    {fieldErrors.subCategory && (
                      <small className="text-danger w-100 mt-1">{fieldErrors.subCategory}</small>
                    )}
                  </div>

                  {/* Images */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Upload Images</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9 d-flex flex-wrap gap-2">
                      {Array.from({ length: MAX_IMAGES }).map((_, idx) => {
                        const image = images[idx];
                        const isNextEmpty = idx === images.length;

                        return (
                          <div key={idx} className="image-slot">
                            {image ? (
                              <>
                                <img src={image.preview} alt={`preview ${idx}`} />
                                <button
                                  type="button"
                                  className="btn btn-danger remove-btn"
                                  onClick={() => removeImage(idx)}
                                >
                                  <IconX stroke={1.5} size={12} />
                                </button>
                              </>
                            ) : (
                              <div
                                className={isNextEmpty ? "plus-label rounded-1" : "empty-label"}
                                onClick={isNextEmpty ? handleEmptyBoxClick : undefined}
                                style={{
                                  cursor: isNextEmpty ? "pointer" : "default",
                                  opacity: isNextEmpty ? 1 : 0.5,
                                }}
                              >
                                {isNextEmpty ? (
                                  <IconPlus stroke={1.5} size={25} />
                                ) : (
                                  <IconCameraPlus stroke={1.5} size={25} />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <input
                        type="file"
                        name="adsImages"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                      />

                      <div className="col-12 form-text text-muted">
                        Upload 1 to {MAX_IMAGES} images (your plan's limit). For the cover picture we recommend using
                        the landscape mode.
                      </div>

                      <div className="col-12 form-text text-muted">
                        {images.length}/{MAX_IMAGES} uploaded
                      </div>

                      {fieldErrors.adsImages && (
                        <small className="text-danger w-100">{fieldErrors.adsImages}</small>
                      )}
                    </div>
                  </div>

                  {/* Condition */}
                  {needsCondition && (
                    <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                      <div className="col-12 col-md-3 col-xl-3">
                        <h1 className="fs-5 mb-3 mb-md-0">Condition</h1>
                      </div>

                      <div className="col-12 col-md-9 col-xl-9 position-relative mb-3 mb-xl-0">
                        <span className="position-absolute top-50 start-0 translate-middle-y ms-3">
                          <IconSearch stroke={1.5} size={20} />
                        </span>

                        <select
                          className={`form-select fs-6 form-select-lg py-3 ps-5 ${
                            fieldErrors.condition ? "is-invalid" : ""
                          }`}
                          name="condition"
                          value={formData.condition}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, condition: e.target.value }));
                            clearError("condition");
                          }}
                          required
                        >
                          <option value="">Select Condition</option>
                          <option value="New">New</option>
                          <option value="Used">Used</option>
                          <option value="Open Box">Open Box</option>
                        </select>

                        {fieldErrors.condition && (
                          <small className="text-danger">{fieldErrors.condition}</small>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Add Title</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9">
                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors.title
                            ? "is-invalid"
                            : touched.title
                            ? isTitleValid
                              ? "is-valid"
                              : "is-invalid"
                            : ""
                        }`}
                        value={formData.title}
                        name="title"
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, title: e.target.value }));
                          clearError("title");
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                        placeholder="Enter title"
                        maxLength={TITLE_MAX}
                        required
                      />

                      <div className="mt-1 d-flex justify-content-between">
                        {!touched.title && !fieldErrors.title && (
                          <small className="text-muted">
                            Mention the key features of your item (e.g. brand, model, age, type)
                          </small>
                        )}

                        {fieldErrors.title && <small className="text-danger">{fieldErrors.title}</small>}

                        {!fieldErrors.title && isTitleInvalid && (
                          <small className="text-danger">
                            Title must be between {TITLE_MIN} and {TITLE_MAX} characters.
                          </small>
                        )}

                        {!fieldErrors.title && touched.title && isTitleValid && (
                          <small className="text-success">Looks good!</small>
                        )}

                        <small
                          className={
                            formData.title.length < TITLE_MIN && touched.title ? "text-danger" : "text-muted"
                          }
                        >
                          {formData.title.length}/{TITLE_MAX}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Description</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9">
                      <textarea
                        className={`form-control ${
                          fieldErrors.description
                            ? "is-invalid"
                            : touched.description
                            ? isDescValid
                              ? "is-valid"
                              : "is-invalid"
                            : ""
                        }`}
                        rows="5"
                        value={formData.description}
                        name="description"
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, description: e.target.value }));
                          clearError("description");
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                        placeholder="Enter detailed description..."
                        maxLength={DESC_MAX}
                        required
                      />

                      <div className="mt-1 d-flex justify-content-between">
                        {!touched.description && !fieldErrors.description && (
                          <small className="text-muted">
                            {needsCondition
                              ? "Include condition, features and reason for selling"
                              : "Describe clearly what you offer, details and pricing"}
                          </small>
                        )}

                        {fieldErrors.description && (
                          <small className="text-danger">{fieldErrors.description}</small>
                        )}

                        {!fieldErrors.description && isDescInvalid && (
                          <small className="text-danger">
                            Description must be between {DESC_MIN} and {DESC_MAX} characters.
                          </small>
                        )}

                        {!fieldErrors.description && touched.description && isDescValid && (
                          <small className="text-success">Looks good!</small>
                        )}

                        <small
                          className={
                            touched.description && formData.description.length < DESC_MIN
                              ? "text-danger"
                              : "text-muted"
                          }
                        >
                          {formData.description.length}/{DESC_MAX}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Location</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9">
                      <div className="col-12 d-flex flex-wrap align-items-center gap-2 mb-3">
                        <div className="col">
                          <select
                            className={`form-select fs-6 form-select-lg py-3 ${
                              fieldErrors.country ? "is-invalid" : ""
                            }`}
                            name="country"
                            value={locationData.country}
                            onChange={handleCountryChange}
                            required
                          >
                            <option value="">Select Country</option>
                            {countries.map((country) => (
                              <option key={country.isoCode} value={country.isoCode}>
                                {country.name}
                              </option>
                            ))}
                          </select>

                          {fieldErrors.country && (
                            <small className="text-danger">{fieldErrors.country}</small>
                          )}
                        </div>

                        <div className="col">
                          <select
                            className={`form-select fs-6 form-select-lg py-3 ${
                              fieldErrors.city ? "is-invalid" : ""
                            }`}
                            name="city"
                            value={locationData.city}
                            onChange={handleCityChange}
                            required
                            disabled={!locationData.country}
                          >
                            <option value="">Select City</option>
                            {/* Profile se aayi city list mein na ho to bhi dikhe */}
                            {locationData.city &&
                              !locationData.cities.some((c) => c.name === locationData.city) && (
                                <option value={locationData.city}>{locationData.city}</option>
                              )}
                            {locationData.cities.map((city, idx) => (
                              <option key={`${city.name}-${idx}`} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>

                          {fieldErrors.city && <small className="text-danger">{fieldErrors.city}</small>}
                        </div>
                      </div>

                      <input
                        type="text"
                        className={`form-control ${fieldErrors.address ? "is-invalid" : ""}`}
                        name="address"
                        placeholder="Enter address (street, area)"
                        value={locationData.address}
                        onChange={(e) => setLocationData((prev) => ({ ...prev, address: e.target.value }))}
                        required
                      />

                      {fieldErrors.address && (
                        <small className="text-danger">{fieldErrors.address}</small>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border border-light-subtle rounded-3 mb-2">
                  <div className="col-12 col-md-3 col-xl-3">
                    <h1 className="fs-5 mb-3 mb-md-0">Price</h1>
                  </div>

                  <div className="col-12 col-md-9 col-xl-9">
                    <div className="position-relative">
                      <span
                        className="position-absolute top-50 start-0 translate-middle-y ps-3 text-dark"
                        style={{ pointerEvents: "none" }}
                      >
                        Rs
                      </span>

                      <input
                        type="number"
                        className={`form-control ps-5 ${fieldErrors.price || priceTooLow ? "is-invalid" : ""}`}
                        name="price"
                        placeholder="Enter price"
                        value={formData.price}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, price: e.target.value }));
                          clearError("price");
                        }}
                        min={minPrice || 0}
                        step="1"
                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                        required
                      />
                    </div>

                    {fieldErrors.price ? (
                      <small className="text-danger">{fieldErrors.price}</small>
                    ) : priceTooLow ? (
                      <small className="text-danger">
                        Minimum price is Rs {minPrice} (approx. $0.50)
                      </small>
                    ) : minPrice ? (
                      <small className="text-muted">
                        Minimum price: Rs {minPrice} (approx. $0.50)
                      </small>
                    ) : null}
                  </div>
                </div>

                {/* Contact */}
                <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border border-light-subtle rounded-3">
                  <div className="col-12 d-flex flex-wrap align-items-center mb-3">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Name</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9">
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={user?.username || ""}
                        placeholder="Enter username"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap align-items-center mb-4">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Mobile Phone No.</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9">
                      <div className="position-relative">
                        <span
                          className="position-absolute top-50 start-0 translate-middle-y ps-2 text-dark"
                          style={{ pointerEvents: "none" }}
                        >
                          +92
                        </span>

                        <input
                          type="tel"
                          className={`form-control rounded-0 ps-5 ${
                            fieldErrors.phoneNumber ? "is-invalid" : ""
                          }`}
                          name="phoneNumber"
                          placeholder="3001234567"
                          value={formData.phoneNumber}
                          onChange={(e) => {
                            // Paste karne par bhi sirf digits rahein
                            setFormData((prev) => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, "") }));
                            clearError("phoneNumber");
                          }}
                          maxLength={15}
                          minLength={10}
                          pattern="[0-9]{10,15}"
                          inputMode="numeric"
                          required
                        />
                      </div>

                      {fieldErrors.phoneNumber && (
                        <small className="text-danger">{fieldErrors.phoneNumber}</small>
                      )}
                    </div>
                  </div>

                  <div className="col-12 d-flex align-items-center justify-content-between mb-4">
                    <p className="mb-0 text-body-secondary">Show my phone number in ads</p>

                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input fs-5"
                        name="phoneNumberStatus"
                        type="checkbox"
                        role="switch"
                        checked={formData.showPhone}
                        onChange={() => setFormData((prev) => ({ ...prev, showPhone: !prev.showPhone }))}
                      />
                    </div>
                  </div>

                  <div className="col-12 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary px-4"
                      style={{ paddingBlock: "12px" }}
                      disabled={adsLoading || limitReached}
                    >
                      {adsLoading ? "Posting..." : limitReached ? "Limit reached" : "Post Now"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="col-12 col-md-4 col-lg-5 col-xl-4 align-self-start">
                <div className="p-3 p-lg-4 border border-light-subtle rounded-3">
                  {/* Header */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle bg-dark d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <span style={{ fontSize: "22px" }}>📢</span>
                    </div>
                    <div>
                      <h5 className="fw-medium mb-0">Post a New Ad</h5>
                      <p className="text-muted small mb-0">Reach buyers in just a few minutes</p>
                    </div>
                  </div>

                  <div className="row g-2 mb-4">
                    <div className="col-6">
                      <div className="border rounded-3 p-2 text-center">
                        <p className="mb-0 fw-medium">One-off Item</p>
                        <p className="text-muted small mb-0">Single listing</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded-3 p-2 text-center">
                        <p className="mb-0 fw-medium">AI + Admin Reviewed</p>
                        <p className="text-muted small mb-0">Before it goes live</p>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <h6 className="fw-medium mb-3">Tips for a great ad</h6>
                  <div className="d-flex flex-column gap-3 mb-4">
                    {[
                      "Choose the correct category and subcategory for better visibility.",
                      "Write a clear title with brand, model and key features.",
                      "Upload bright, high-quality photos. Use landscape for the cover.",
                      "Be honest about condition and mention any defects.",
                    ].map((tip, i) => (
                      <div key={i} className="d-flex align-items-start gap-2">
                        <span
                          className="badge fw-medium bg-dark rounded-circle flex-shrink-0"
                          style={{ width: "22px", height: "22px" }}
                        >
                          {i + 1}
                        </span>
                        <p className="small text-muted mb-0">{tip}</p>
                      </div>
                    ))}
                  </div>

                  {/* Price rule */}
                  <div
                    className="p-3 rounded-3 mb-3"
                    style={{ backgroundColor: "#f0fbf4", border: "1px solid #b9e6c8" }}
                  >
                    <p className="fw-medium text-dark mb-1">💰 Minimum Price</p>
                    <p className="text-muted small mb-0">
                      {minPrice
                        ? `Price must be at least Rs ${minPrice} (approx. $0.50). Updated with the live exchange rate.`
                        : "Price must be at least $0.50, shown in PKR."}
                    </p>
                  </div>

                  {/* Plan limits */}
                  <div
                    className="p-3 rounded-3 mb-3"
                    style={{ backgroundColor: "#eef4ff", border: "1px solid #c7dbff" }}
                  >
                    <p className="fw-medium text-dark mb-1">💎 Your Plan Limits</p>
                    <p className="text-muted small mb-0">
                      Ads and products have separate limits, and only active and pending listings use a
                      slot. Sold, deleted, rejected and expired listings free their slot. See your full
                      usage under Dashboard → Subscription.
                    </p>
                  </div>

                  {/* Pending */}
                  <div
                    className="p-3 rounded-3 mb-3"
                    style={{ backgroundColor: "#fff8e6", border: "1px solid #f0dca0" }}
                  >
                    <p className="fw-medium text-dark mb-1">⏳ Pending Approval</p>
                    <p className="text-muted small mb-0">
                      Your ad is checked automatically and may need admin approval. It stays hidden from
                      buyers until it is approved. You can see the result on your dashboard.
                    </p>
                  </div>

                  {/* Policy */}
                  <div className="p-3 rounded-3 bg-light border">
                    <p className="fw-medium text-dark mb-1">🔒 Platform Policy</p>
                    <p className="text-muted small mb-0">
                      Listings containing false, misleading, or prohibited content may be removed without
                      notice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AdAutofillModal
        show={showAutofillModal}
        onClose={() => setShowAutofillModal(false)}
        onApply={handleApplyAutofill}
      />
    </div>
  );
};

export default CreateAds;