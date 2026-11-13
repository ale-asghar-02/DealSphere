import { IconShoppingBag } from "@tabler/icons-react";

// Ad aur Product dono ke liye. Sold ho to "has been Sold", warna "currently unavailable".
const SoldOverlay = ({ isAdvertisement = true, status = "sold" }) => {
  const noun = isAdvertisement ? "Ad" : "Product";
  const title = status === "sold" ? `This ${noun} has been Sold` : `This ${noun} is currently unavailable`;

  return (
    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-2" style={{ zIndex: 10, background: "rgba(0,0,0,0.41)", backdropFilter: "blur(2px)" }}>
      <IconShoppingBag size={52} color="#fff" />
      <span className="text-white fs-4 fw-semibold mt-2">{title}</span>
      <span className="text-white">This conversation is no longer active right now.</span>
    </div>
  );
};

export default SoldOverlay;