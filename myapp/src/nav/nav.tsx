import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaHome, FaInfoCircle } from 'react-icons/fa';
import keloLogo from '../assets/kelo_logo.jpeg';
import './nav.css';

const navItems = [
  { path: '/', label: 'Home', icon: <FaHome />, emoji: '🏠' },
  { path: '/about', label: 'About', icon: <FaInfoCircle />, emoji: 'ℹ️' },
  { path: '/events', label: 'Events', icon: null, emoji: '🎉' },
  { path: '/cart', label: 'Cart', icon: <FaShoppingCart />, emoji: '🛒', isCart: true },
];

export default function Nav() {
  const { cartCount } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className="navbar-header">
      <div className="top-banner">
        <div className="top-banner-content">
          <span className="banner-text">✨ Handcrafted Gifts & Artisanal Crafts</span>
          <span className="banner-divider">•</span>
          <span className="banner-text">Free Delivery on Orders Over ₹500</span>
        </div>
      </div>

      <nav className="navbar" aria-label="Main Navigation">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" aria-label="KELO Homepage">
            <div className="logo-badge">
              <img src={keloLogo} alt="KELO Logo" className="logo-img" />
            </div>
            <div className="logo-text-wrapper">
              <span className="logo-title">KELO</span>
              <span className="logo-subtitle">The key to your Unexpressed love</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="nav-menu desktop-nav">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-links ${item.isCart ? 'cart-link' : ''} ${isActive(item.path) ? 'active' : ''}`}
                  aria-label={item.label}
                >
                  {item.icon
                    ? <span className="nav-icon">{item.icon}</span>
                    : <span className="nav-icon" style={{ display: 'inline-flex' }}>{item.emoji}</span>
                  }
                  {item.isCart && cartCount > 0 && (
                    <span className="cart-badge" key={cartCount}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                  <span className="nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger button */}
          <button
            className={`wood-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {menuOpen && <div className="wood-backdrop" onClick={() => setMenuOpen(false)} />}

      {/* Wooden Tag Board */}
      <div className={`wood-board ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        {/* Rope hanging from top */}
        <div className="wood-rope-top">
          <div className="wood-nail" />
          <div className="wood-rope-line" />
        </div>

        {/* Tags */}
        <div className="wood-tags">
          {navItems.map((item, i) => (
            <div key={item.path} className="wood-tag-wrap">
              {/* Rope connector between tags */}
              {i > 0 && <div className="wood-tag-rope" />}

              <Link
                to={item.path}
                className={`wood-tag ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {/* Tag hole */}
                <div className="wood-tag-hole" />
                <span className="wood-tag-emoji">{item.emoji}</span>
                <span className="wood-tag-label">{item.label}</span>
                {item.isCart && cartCount > 0 && (
                  <span className="wood-tag-count">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
