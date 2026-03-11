import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaShoppingCart } from 'react-icons/fa';
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
            <Link to="/" className="nav-links">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-links">About Us</Link>
          </li>
          <li className="nav-item cart-item">
            <Link to="/cart" className="nav-links cart-link">
              <FaShoppingCart className="cart-icon" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              <span className="cart-text">Cart</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
