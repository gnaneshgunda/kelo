import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaHome, FaInfoCircle } from 'react-icons/fa';
import keloLogoOld from '../assets/kelo_logo.jpeg';
import logoNav from '../assets/logo-nav.jpeg';
import './nav.css';

export default function Nav() {
  const { cartCount } = useCart();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          {/* Desktop logo */}
          <div className="logo-desktop-container">
            <img src={keloLogoOld} alt="KELO Logo" className="logo-img-old" />
            <h1 className="logo-title">KELO</h1>
          </div>
          {/* Mobile logo */}
          <h1 className="logo-title-mobile">KELO</h1>
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
