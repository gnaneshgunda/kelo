import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaHome, FaInfoCircle } from 'react-icons/fa';
import './nav.css';

export default function Nav() {
  const { cartCount } = useCart();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-placeholder"></div>
          <h1>KeLo</h1>
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links">
              <FaHome className="nav-icon" />
              <span className="nav-text">Home</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-links">
              <FaInfoCircle className="nav-icon" />
              <span className="nav-text">About Us</span>
            </Link>
          </li>
          <li className="nav-item cart-item">
            <Link to="/cart" className="nav-links cart-link">
              <div className="cart-icon-container">
                <FaShoppingCart className="nav-icon cart-icon" />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
              <span className="nav-text">Cart</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
