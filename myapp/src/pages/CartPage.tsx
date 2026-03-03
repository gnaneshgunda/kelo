import { useCart } from '../context/CartContext';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './CartPage.css';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  // Replace with actual Google Forms URL
  const GOOGLE_FORMS_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf4dummy_link/viewform?usp=sf_link";

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <FaShoppingCart size={60} className="empty-icon" />
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any handcrafted items yet.</p>
        <Link to="/" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Your Shopping Cart</h2>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.product.id} className="cart-item">
              <img src={item.product.imageUrl} alt={item.product.name} className="cart-item-img" />

              <div className="cart-item-details">
                <h3>{item.product.name}</h3>
                <p className="cart-item-price">${item.product.price.toFixed(2)}</p>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="remove-btn"
                    aria-label="Remove item"
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>

              <div className="cart-item-total">
                <p>${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>

          <a
            href={GOOGLE_FORMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-checkout"
          >
            Buy via Google Form
          </a>
          <p className="checkout-note">
            You will be redirected to a Google Form to complete your purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
