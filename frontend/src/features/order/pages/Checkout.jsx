import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Country, City } from "country-state-city";
import useOrder from "../hooks/useOrder";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { product, quantity, items, source } = location.state || {};

  const { handleBuyNow, handleCheckoutFromCart, orderLoading } = useOrder();

  // items normalized to one shape regardless of source
  const checkoutItems =
    source === "cart" ? items || [] : product ? [{ product, quantity: quantity || 1 }] : [];

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phoneNumber: "",
    country: "", // full country name — stored in DB
    city: "", // full city name — stored in DB
    addressLine: "",
  });

  // isoCode kept separately just to drive the City dropdown; not sent to backend
  const [countryIsoCode, setCountryIsoCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(
    () => (countryIsoCode ? City.getCitiesOfCountry(countryIsoCode) : []),
    [countryIsoCode]
  );

  const handleCountryChange = (isoCode) => {
    const selected = countries.find((c) => c.isoCode === isoCode);
    setCountryIsoCode(isoCode);
    setShippingAddress((prev) => ({
      ...prev,
      country: selected?.name || "",
      city: "", // reset city when country changes
    }));
  };

  const totalAmount = checkoutItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handleAddressChange = (field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    const { fullName, phoneNumber, country, city, addressLine } = shippingAddress;
    if (!fullName || !phoneNumber || !country || !city || !addressLine) {
      toast.error("Please fill all required shipping address fields");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    if (!checkoutItems.length) {
      toast.error("No items to checkout");
      return;
    }

    const payload =
      source === "cart"
        ? { shippingAddress, paymentMethod }
        : {
            productId: product._id,
            quantity: quantity || 1,
            shippingAddress,
            paymentMethod,
          };

    const data =
      source === "cart" ? await handleCheckoutFromCart(payload) : await handleBuyNow(payload);

    if (!data) return; // error already toasted inside the hook

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl; // Stripe hosted checkout redirect
    } else {
      navigate(`/payment/success?flow=order&method=cod&orderId=${data.data._id}`, { replace: true });
    }
  };

  if (!checkoutItems.length) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted mb-3">No items to checkout.</p>
        <button className="btn btn-outline-primary" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h4 className="fw-semibold mb-4">Checkout</h4>

      <div className="row g-4">
        {/* Left — Delivery + Payment */}
        <div className="col-12 col-lg-7">
          {/* Delivery Address */}
          <div className="border rounded-3 px-3 px-md-4 py-4 mb-4">
            <h6 className="fw-semibold mb-3">
              <i className="ti ti-map-pin me-2"></i>Delivery Address
            </h6>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={shippingAddress.fullName}
                  onChange={(e) => handleAddressChange("fullName", e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={shippingAddress.phoneNumber}
                  onChange={(e) => handleAddressChange("phoneNumber", e.target.value)}
                  placeholder="03xxxxxxxxx"
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted">Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={shippingAddress.addressLine}
                  onChange={(e) => handleAddressChange("addressLine", e.target.value)}
                  placeholder="House no, Street, Area"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted">Country</label>
                <select
                  className="form-select py-3"
                  value={countryIsoCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted">City</label>
                <select
                  className="form-select py-3"
                  value={shippingAddress.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  disabled={!countryIsoCode}
                >
                  <option value="">
                    {countryIsoCode ? "Select city" : "Select country first"}
                  </option>
                  {cities.map((city) => (
                    <option key={`${city.name}-${city.latitude}`} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border rounded-3 p-3 p-md-4">
            <h6 className="fw-semibold mb-3">
              <i className="ti ti-credit-card me-2"></i>Payment Method
            </h6>

            <div className="d-flex flex-wrap flex-md-nowrap gap-3 mb-4">
              <div
                className={`col-12 col-md-6 border rounded-3 p-3 flex-grow-1 d-flex align-items-center gap-2 ${
                  paymentMethod === "cod" ? "border-primary bg-primary bg-opacity-10" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setPaymentMethod("cod")}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: paymentMethod === "cod" ? "5px solid #0d6efd" : "2px solid #aaa",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p className="mb-0 fw-medium small">Cash on Delivery</p>
                  <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                    Pay when delivered
                  </p>
                </div>
              </div>
              <div
                className={`col-12 col-md-6 border rounded-3 p-3 flex-grow-1 d-flex align-items-center gap-2 ${
                  paymentMethod === "stripe" ? "border-primary bg-primary bg-opacity-10" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setPaymentMethod("stripe")}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: paymentMethod === "stripe" ? "5px solid #0d6efd" : "2px solid #aaa",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p className="mb-0 fw-medium small">Card Payment</p>
                  <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                    Secure online payment via Stripe
                  </p>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary w-100"
              style={{ paddingBlock: "12px" }}
              onClick={handlePlaceOrder}
              disabled={orderLoading}
            >
              {orderLoading ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : paymentMethod === "cod" ? (
                <i className="ti ti-shopping-bag-check me-2"></i>
              ) : (
                <i className="ti ti-credit-card me-2"></i>
              )}
              {paymentMethod === "cod"
                ? "Place Order — Cash on Delivery"
                : `Pay Rs. ${totalAmount.toLocaleString()}`}
            </button>
          </div>
        </div>

        {/* Right — Order Summary */}
        <div className="col-12 col-lg-5">
          <div className="border rounded-3 p-3 p-md-4">
            <h6 className="fw-semibold mb-3">Order Summary</h6>

            <div className="d-flex flex-column gap-3 mb-3">
              {checkoutItems.map((item) => (
                <div key={item.product._id} className="d-flex align-items-center gap-2">
                  <img
                    src={item.product?.productImages?.[0]?.url || item.product?.productImages?.[0]}
                    alt={item.product?.title}
                    width={50}
                    height={55}
                    className="rounded-2 object-fit-cover border flex-shrink-0"
                  />
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="mb-0 small fw-medium text-truncate">{item.product?.title}</p>
                    <p className="mb-0 text-muted small">Qty: {item.quantity}</p>
                  </div>
                  <span className="small fw-medium flex-shrink-0">
                    Rs. {((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <hr />

            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Subtotal</span>
              <span className="small">Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted small">Delivery</span>
              <span className="small text-success">Free</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="fw-semibold">Total</span>
              <span className="fw-bold text-primary fs-5">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;