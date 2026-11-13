import { Link } from "react-router-dom";

const NavItems = () => {
  return (
      <ul className="navbar-nav mb-2 mb-md-0 gap-lg-3 me-auto">
        <li className="nav-item">
          <Link className="nav-link" to="/deals">Deals</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/design">Genio</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/services">Services</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/products">Products</Link>
        </li>
      </ul>
  );
};

export default NavItems;