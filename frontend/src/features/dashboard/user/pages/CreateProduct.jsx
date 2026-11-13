import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Country, City } from "country-state-city";
import { IconCameraPlus, IconPlus, IconX, IconTrash, IconSparkles } from "@tabler/icons-react";

import { AuthContext } from "../../../auth/AuthContext";
import useSellerProduct from "../hooks/useSellerProduct";
import useCategory from "@/features/category/hooks/useCategory";
import Navbar from "@/components/Navbar/Navbar";
import ProductAutofillModal from "../../../aiAssistant/components/ProductAutofillModal";
import { useImageLimit, useListingLimit } from "../../../subscription/hooks/useSubscription";
import ListingLimitBanner from "../../../subscription/components/ListingLimitBanner";
import { getMinPricePkr, isPriceTooLow } from "../store/minPriceHelper";

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { productLoading, fieldErrors, setFieldErrors, handleSellerCreateProduct } = useSellerProduct();
  const { category, subCategory, catLoading, handleDisplayCategory, handleDisplaySubCategory } = useCategory();

  // Subscription: image limit of the seller's plan + live products limit
  const MAX_IMAGES = useImageLimit("product");
  const { reached: limitReached } = useListingLimit("product");

  // ── AI Autofill ──
  const [showAutofillModal, setShowAutofillModal] = useState(false);

  // ── Category & Subcategory (select field se) ──
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  useEffect(() => {
    handleDisplayCategory();
  }, []);

  const handleCategoryChange = (e) => {
    const id = e.target.value;
    setSelectedCategory(id);
    setSelectedSubcategory("");
    if (id) handleDisplaySubCategory(id);
  };

  const handleSubcategoryChange = (e) => setSelectedSubcategory(e.target.value);

  // ── Images (min 1, max = plan limit) ──
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const handleEmptyBoxClick = () => {
    fileInputRef.current.click();
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

    const filesToAdd = files.slice(0, remainingSlots);

    const newImages = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    setFieldErrors((prev) => ({ ...prev, productImages: undefined }));
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Title (min 10, max 120) ──
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  const minLength = 10;
  const maxLength = 120;
  const isInvalid = touched && (title.length < minLength || title.length > maxLength);

  // ── Description (min 30, max 5000) ──
  const [description, setDescription] = useState("");
  const [descTouched, setDescTouched] = useState(false);
  const descMinLength = 30;
  const descMaxLength = 5000;
  const isDescInvalid =
    descTouched && (description.length < descMinLength || description.length > descMaxLength);

  // ── Price ──
  const [price, setPrice] = useState("");
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);

  // ── Minimum price ($0.50 in PKR, live rate) ──
  const [minPrice, setMinPrice] = useState(null);

  useEffect(() => {
    getMinPricePkr().then(setMinPrice);
  }, []);

  const priceTooLow = isPriceTooLow(price, minPrice);

  // ── Stock ──
  const [stock, setStock] = useState(1);

  // ── Attributes (dynamic key-value pairs) ──
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);

  const handleAttributeChange = (idx, field, value) => {
    setAttributes((prev) => prev.map((attr, i) => (i === idx ? { ...attr, [field]: value } : attr)));
  };

  const addAttributeRow = () => {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeAttributeRow = (idx) => {
    setAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Location ──
  const countries = Country.getAllCountries();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");

  const handleCountryChange = (e) => {
    const isoCode = e.target.value;
    setSelectedCountry(isoCode);
    setSelectedCity("");
    setCities(isoCode ? City.getCitiesOfCountry(isoCode) : []);
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  // ── Contact ──
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [chatOnly, setChatOnly] = useState(false);

  // ── helper: find a country-state-city entry tolerant of casing/whitespace ──
  const findCountryByName = (name) => {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return (
      countries.find((c) => c.name.trim().toLowerCase() === clean) ||
      countries.find((c) => c.name.trim().toLowerCase().includes(clean)) ||
      null
    );
  };

  const findCityByName = (cityList, name) => {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return (
      cityList.find((c) => c.name.trim().toLowerCase() === clean) ||
      cityList.find((c) => c.name.trim().toLowerCase().includes(clean)) ||
      null
    );
  };

  useEffect(() => {
    if (!user) return;

    if (user.country) {
      // user.country DB mein ISO code (jaise "NO") ke roop mein store hai
      const countryObj = countries.find(
        (c) => c.isoCode.toLowerCase() === user.country.trim().toLowerCase()
      );

      if (countryObj) {
        setSelectedCountry(countryObj.isoCode);

        const cityList = City.getCitiesOfCountry(countryObj.isoCode);
        setCities(cityList);

        if (user.city) {
          const cityObj = findCityByName(cityList, user.city);
          setSelectedCity(cityObj ? cityObj.name : "");
        }
      }
    }
  }, [user]);

  // ── AI Autofill: apply data returned from modal into form fields ──
  const handleApplyAutofill = (data) => {
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);

    if (data.category) {
      setSelectedCategory(data.category);
      if (data.subCategory) {
        handleDisplaySubCategory(data.category);
        setSelectedSubcategory(data.subCategory);
      }
    }

    if (data.price) setPrice(data.price);

    if (Array.isArray(data.attributes) && data.attributes.length > 0) {
      const cleanAttrs = data.attributes.filter((a) => a.key && a.value);
      if (cleanAttrs.length > 0) setAttributes(cleanAttrs);
    }

    if (data.country) {
      const countryObj = findCountryByName(data.country);
      if (countryObj) {
        setSelectedCountry(countryObj.isoCode);
        const cityList = City.getCitiesOfCountry(countryObj.isoCode);
        setCities(cityList);

        if (data.city) {
          const cityObj = findCityByName(cityList, data.city);
          setSelectedCity(cityObj ? cityObj.name : "");
        } else {
          setSelectedCity("");
        }
      } else {
        console.warn("Autofill: could not match country from AI:", data.country);
      }
    }
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (limitReached) return; // the banner above already explains why
    setFieldErrors({});

    if (images.length === 0) {
      setFieldErrors({ productImages: "At least one image is required" });
      return;
    }

    if (priceTooLow) {
      setFieldErrors({ price: `Minimum price is Rs ${minPrice} (approx. $0.50)` });
      return;
    }

    const countryObj = countries.find((c) => c.isoCode === selectedCountry);
    const cityObj = cities.find((c) => c.name === selectedCity);

    const cleanAttributes = attributes.filter((a) => a.key && a.value);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", selectedCategory);
    formData.append("subCategory", selectedSubcategory);
    formData.append("price", price);
    formData.append("isPriceNegotiable", isPriceNegotiable);
    formData.append("stock", stock);
    formData.append("country", countryObj?.name || "");
    formData.append("city", cityObj?.name || "");
    formData.append("contactInfo", JSON.stringify({ phoneNumber, showPhone, chatOnly }));
    formData.append("attributes", JSON.stringify(cleanAttributes));

    images.forEach((img) => {
      formData.append("productImages", img.file);
    });

    const result = await handleSellerCreateProduct(formData);

    if (result) {
      setTitle("");
      setDescription("");
      setPrice("");
      setIsPriceNegotiable(false);
      setStock(1);
      setAttributes([{ key: "", value: "" }]);
      setPhoneNumber("");
      setShowPhone(true);
      setChatOnly(false);
      setSelectedCountry("");
      setSelectedCity("");
      setCities([]);
      setSelectedCategory("");
      setSelectedSubcategory("");
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      setTouched(false);
      setDescTouched(false);

      navigate("/user/dashboard");
    }
  };

  return (
    <div className="create-advertisement-section pb-5">
      <Navbar />
      <div className="container-fluid">
        <div className="row px-lg-2">
          <div className="col-12 mb-3">
            <p className="text-body-secondary">
              Home / Dashboard / Create <span className="text-dark">/ Product</span>
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="col-12 d-flex flex-wrap flex-md-nowrap gap-2 pe-md-2">
              <div className="col-12 col-md-8 col-lg-7 col-xl-8">
                {/* Live products limit of the current plan */}
                <ListingLimitBanner type="product" className="mb-2" />

                <div className="col-12 border border-light-subtle rounded-3 mb-2">
                  {/* AI Autofill trigger */}
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

                  {/* Category (select) */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Category</h1>
                    </div>
                    <div className="col-12 col-md-9 col-xl-9">
                      <select
                        className={`form-select fs-6 form-select-lg py-3 ${
                          fieldErrors.category ? "is-invalid" : ""
                        }`}
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        disabled={catLoading}
                        required
                      >
                        <option value="">Select Category</option>
                        {category.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.category && (
                        <small className="text-danger">{fieldErrors.category}</small>
                      )}
                    </div>
                  </div>

                  {/* SubCategory (select, sirf jab category ho) */}
                  {selectedCategory && (
                    <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                      <div className="col-12 col-md-3 col-xl-3">
                        <h1 className="fs-5 mb-3 mb-md-0">Sub Category</h1>
                      </div>
                      <div className="col-12 col-md-9 col-xl-9">
                        <select
                          className={`form-select fs-6 form-select-lg py-3 ${
                            fieldErrors.subCategory ? "is-invalid" : ""
                          }`}
                          value={selectedSubcategory}
                          onChange={handleSubcategoryChange}
                          disabled={catLoading}
                          required
                        >
                          <option value="">Select Sub Category</option>
                          {subCategory.map((sub) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.subCategory && (
                          <small className="text-danger">{fieldErrors.subCategory}</small>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload Images (min 1, max = plan limit) */}
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
                        name="productImages"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                      />
                      <div className="col-12 form-text text-muted">
                        Upload 1 to {MAX_IMAGES} images (your plan's limit). For the cover picture we
                        recommend using the landscape mode.
                      </div>
                      <div className="col-12 form-text text-muted">
                        {images.length}/{MAX_IMAGES} uploaded
                      </div>
                      {fieldErrors.productImages && (
                        <small className="text-danger w-100">{fieldErrors.productImages}</small>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Add Title</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9">
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.title || isInvalid ? "is-invalid" : ""}`}
                        value={title}
                        name="title"
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => setTouched(true)}
                        placeholder="Enter title"
                        maxLength={maxLength}
                        required
                      />

                      <div className="mt-1 d-flex justify-content-between">
                        {!touched && !fieldErrors.title && (
                          <small className="text-muted">
                            Mention the key features of your item (e.g. brand, model, age, type)
                          </small>
                        )}
                        {fieldErrors.title && <small className="text-danger">{fieldErrors.title}</small>}
                        {!fieldErrors.title && isInvalid && (
                          <small className="text-danger">
                            Title must be between {minLength} and {maxLength} characters.
                          </small>
                        )}

                        <small
                          className={title.length < minLength && touched ? "text-danger" : "text-muted"}
                        >
                          {title.length}/{maxLength}
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
                          fieldErrors.description || isDescInvalid ? "is-invalid" : ""
                        }`}
                        rows="5"
                        value={description}
                        name="description"
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => setDescTouched(true)}
                        placeholder="Enter detailed description..."
                        maxLength={descMaxLength}
                        required
                      ></textarea>

                      <div className="mt-1 d-flex justify-content-between">
                        {!descTouched && !fieldErrors.description && (
                          <small className="text-muted">
                            Include condition, features and reason for selling
                          </small>
                        )}
                        {fieldErrors.description && (
                          <small className="text-danger">{fieldErrors.description}</small>
                        )}
                        {!fieldErrors.description && isDescInvalid && (
                          <small className="text-danger">
                            Description must be between {descMinLength} and {descMaxLength} characters.
                          </small>
                        )}

                        <small
                          className={
                            descTouched && description.length < descMinLength
                              ? "text-danger"
                              : "text-muted"
                          }
                        >
                          {description.length}/{descMaxLength}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Attributes (dynamic key-value, e.g. Condition, Brand, Color etc.) */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border-bottom">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Attributes</h1>
                    </div>

                    <div className="col-12 col-md-9 col-xl-9">
                      {attributes.map((attr, idx) => (
                        <div key={idx} className="d-flex gap-2 mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Condition, Brand, Color"
                            value={attr.key}
                            onChange={(e) => handleAttributeChange(idx, "key", e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. New, Sony, Red"
                            value={attr.value}
                            onChange={(e) => handleAttributeChange(idx, "value", e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeAttributeRow(idx)}
                            disabled={attributes.length === 1}
                          >
                            <IconTrash size={18} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm mt-1"
                        onClick={addAttributeRow}
                      >
                        <IconPlus size={16} className="me-1" /> Add Attribute
                      </button>
                      {fieldErrors.attributes && (
                        <small className="text-danger d-block mt-1">{fieldErrors.attributes}</small>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4">
                    <div className="col-12 col-md-3 col-xl-3">
                      <h1 className="fs-5 mb-3 mb-md-0">Location</h1>
                    </div>
                    <div className="col-12 col-md-9 col-xl-9">
                      <div className="col-12 d-flex flex-wrap align-items-center gap-2">
                        <div className="col">
                          <select
                            className={`form-select fs-6 form-select-lg py-3 ${
                              fieldErrors.country ? "is-invalid" : ""
                            }`}
                            name="country"
                            value={selectedCountry}
                            onChange={handleCountryChange}
                            required
                          >
                            <option value="">Select Country</option>
                            {countries.map((c) => (
                              <option key={c.isoCode} value={c.isoCode}>
                                {c.name}
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
                            value={selectedCity}
                            onChange={handleCityChange}
                            required
                            disabled={!selectedCountry}
                          >
                            <option value="">Select City</option>
                            {cities.map((city, idx) => (
                              <option key={`${city.name}-${idx}`} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.city && <small className="text-danger">{fieldErrors.city}</small>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price & Stock */}
                <div className="col-12 d-flex flex-wrap align-items-center p-3 p-lg-4 border border-light-subtle rounded-3 mb-2">
                  <div className="col-12 col-md-3 col-xl-3">
                    <h1 className="fs-5 mb-3 mb-md-0">Price</h1>
                  </div>

                  <div className="col-12 col-md-9 col-xl-9">
                    <div className="position-relative mb-2">
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
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min={minPrice || 0}
                        step="1"
                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                        required
                      />
                    </div>

                    {fieldErrors.price ? (
                      <small className="text-danger d-block mb-2">{fieldErrors.price}</small>
                    ) : priceTooLow ? (
                      <small className="text-danger d-block mb-2">
                        Minimum price is Rs {minPrice} (approx. $0.50) per item
                      </small>
                    ) : minPrice ? (
                      <small className="text-muted d-block mb-2">
                        Minimum price: Rs {minPrice} (approx. $0.50) per item
                      </small>
                    ) : null}

                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <p className="mb-0 text-body-secondary">Price is negotiable</p>
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input fs-5"
                          type="checkbox"
                          role="switch"
                          checked={isPriceNegotiable}
                          onChange={() => setIsPriceNegotiable(!isPriceNegotiable)}
                        />
                      </div>
                    </div>

                    <label className="form-label mb-1">Stock</label>
                    <input
                      type="number"
                      className={`form-control ${fieldErrors.stock ? "is-invalid" : ""}`}
                      name="stock"
                      placeholder="Available quantity"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      min="0"
                      step="1"
                      required
                    />
                    {fieldErrors.stock && <small className="text-danger">{fieldErrors.stock}</small>}
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
                  <div className="col-12 d-flex flex-wrap align-items-center mb-3">
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
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          maxLength={15}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          onKeyDown={(e) => {
                            if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                              e.preventDefault();
                            }
                          }}
                          required
                        />
                      </div>
                      {fieldErrors.phoneNumber && (
                        <small className="text-danger">{fieldErrors.phoneNumber}</small>
                      )}
                    </div>
                  </div>
                  <div className="col-12 d-flex align-items-center justify-content-between mb-3">
                    <p className="mb-0 text-body-secondary">Show my phone number</p>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input fs-5"
                        name="showPhone"
                        type="checkbox"
                        role="switch"
                        checked={showPhone}
                        onChange={() => setShowPhone(!showPhone)}
                      />
                    </div>
                  </div>
                  <div className="col-12 d-flex align-items-center justify-content-between mb-4">
                    <p className="mb-0 text-body-secondary">Buyers can only chat, no calls</p>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input fs-5"
                        name="chatOnly"
                        type="checkbox"
                        role="switch"
                        checked={chatOnly}
                        onChange={() => setChatOnly(!chatOnly)}
                      />
                    </div>
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary px-4"
                      style={{ paddingBlock: "12px" }}
                      disabled={productLoading || limitReached}
                    >
                      {productLoading ? "Posting..." : limitReached ? "Limit reached" : "Post Now"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div
                className="col-12 col-md-4 col-lg-5 col-xl-4 align-self-start">
                <div className="p-3 p-lg-4 border border-light-subtle rounded-3">
                  {/* Header */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle bg-dark d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <span style={{ fontSize: "22px" }}>📦</span>
                    </div>
                    <div>
                      <h5 className="fw-medium mb-0">List a New Product</h5>
                      <p className="text-muted small mb-0">Sell in stock, not one-off items</p>
                    </div>
                  </div>

                  <div className="row g-2 mb-4">
                    <div className="col-6">
                      <div className="border rounded-3 p-2 text-center">
                        <p className="mb-0 fw-medium">Stock-based</p>
                        <p className="text-muted small mb-0">Sell multiple units</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded-3 p-2 text-center">
                        <p className="mb-0 fw-medium">Admin Reviewed</p>
                        <p className="text-muted small mb-0">Before it goes live</p>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <h6 className="fw-medium mb-3">Before you post</h6>
                  <div className="d-flex flex-column gap-3 mb-4">
                    {[
                      "Pick the right category and subcategory. Buyers filter by these first.",
                      "Add attributes like brand, condition, color or size for better search matches.",
                      "Keep the stock count accurate. It drops automatically as units sell.",
                      'Turn on "Price negotiable" only if you are open to offers.',
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
                        ? `Each item must be priced at least Rs ${minPrice} (approx. $0.50). Updated with the live exchange rate.`
                        : "Each item must be priced at least $0.50, shown in PKR."}
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
                    className="p-3 rounded-3"
                    style={{ backgroundColor: "#fff8e6", border: "1px solid #f0dca0" }}
                  >
                    <p className="fw-medium text-dark mb-1">⏳ Pending Approval</p>
                    <p className="text-muted small mb-0">
                      Your product stays hidden from buyers until an admin approves it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ProductAutofillModal
        show={showAutofillModal}
        onClose={() => setShowAutofillModal(false)}
        onApply={handleApplyAutofill}
      />
    </div>
  );
};

export default CreateProduct;