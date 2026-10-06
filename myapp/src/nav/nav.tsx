import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaHome, FaInfoCircle } from 'react-icons/fa';
import keloLogo from '../assets/kelo_logo.jpeg';
import './nav.css';

export default function Nav() {
  const { cartCount } = useCart();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="navbar-header">
      {/* Top luxury announcement bar */}
      <div className="top-banner">
        <div className="top-banner-content">
          <span className="banner-text">✨ Handcrafted Gifts & Artisanal Crafts</span>
          <span className="banner-divider">•</span>
          <span className="banner-text">Free Shipping on Orders Over $50</span>
        </div>
      </div>

      {/* Main navigation bar */}
      <nav className="navbar" aria-label="Main Navigation">
        <div className="navbar-container">
          {/* Logo Section */}
          <Link to="/" className="navbar-logo" aria-label="KELO Homepage">
            <div className="logo-badge">
              <img src={keloLogo} alt="KELO Logo" className="logo-img" />
            </div>
            <div className="logo-text-wrapper">
              <span className="logo-title">KELO</span>
              <span className="logo-subtitle">The key to your Unexpressed love</span>
            </div>
          </Link>

          {/* Nav Links & Actions */}
          <ul className="nav-menu">
            <li className="nav-item">
              <Link
                to="/"
                className={`nav-links ${isActive('/') ? 'active' : ''}`}
                aria-current={isActive('/') ? 'page' : undefined}
                aria-label="Home"
              >
                <FaHome className="nav-icon" aria-hidden="true" />
                <span className="nav-text">Home</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-links ${isActive('/about') ? 'active' : ''}`}
                aria-current={isActive('/about') ? 'page' : undefined}
                aria-label="About Us"
              >
                <FaInfoCircle className="nav-icon" aria-hidden="true" />
                <span className="nav-text">About Us</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/events"
                className={`nav-links ${isActive('/events') ? 'active' : ''}`}
                aria-current={isActive('/events') ? 'page' : undefined}
                aria-label="Events"
              >
                <span className="nav-icon" style={{ display: 'inline-flex' }}>🎉</span>
                <span className="nav-text">Events</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/cart"
                className={`nav-links cart-link ${isActive('/cart') ? 'active' : ''}`}
                aria-current={isActive('/cart') ? 'page' : undefined}
                aria-label={`Shopping Cart with ${cartCount} items`}
              >
                <FaShoppingCart className="nav-icon cart-icon" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="cart-badge" key={cartCount}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
                <span className="nav-text cart-text">Cart</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

