import AdsList from "./AdsList";
import ProductsList from "./ProductsList";

// Entry point — sirf yahan decide hota hai ads dikhana hai ya products
const SellerPostList = ({ typeFilter = "ads", statusFilter = "" }) => {
  if (typeFilter === "products") {
    return <ProductsList statusFilter={statusFilter} />;
  }
  return <AdsList statusFilter={statusFilter} />;
};

export default SellerPostList;