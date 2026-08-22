import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { FaTrash, FaShoppingCart, FaCheckCircle, FaLock, FaTruck } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { CheckoutResponse } from '../types';
import './CartPage.css';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();

  // Checkout Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CheckoutResponse | null>(null);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setCheckoutError('Please provide a contact phone number for delivery updates');
      return;
    }

    try {
      setIsSubmitting(true);
      setCheckoutError(null);

      const payload = {
        name: name.trim() || 'Valued Customer',
        email: email.trim() || undefined,
        phoneno: phone.trim(),
        shipping_address: address.trim() || 'IIT Kharagpur Campus Delivery',
        cart: cartItems.map((item) => ({
          id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const response = await api.submitCheckout(payload);

      if (response.success) {
        setCompletedOrder(response);
        clearCart();
      } else {
        setCheckoutError(response.error || 'Failed to complete order. Please try again.');
      }
    } catch (err: any) {
      console.error('[Checkout Error]', err);
      setCheckoutError(err.message || 'Network error occurred during checkout. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 1. Order Success Screen ──────────────────────────────────────────────
  if (completedOrder) {
    return (
      <div className="cart-container">
        <div className="order-success-card">
          <div className="success-icon-wrap">
            <FaCheckCircle className="success-icon" />
          </div>
          <h2>Order Confirmed!</h2>
          <p className="order-success-sub">
            Thank you, <strong>{completedOrder.order?.name || name || 'Valued Customer'}</strong>. Your handcrafted gifts order has been received!
          </p>

          <div className="order-details-box">
            <div className="order-meta-row">
              <span>Order ID:</span>
              <strong>#{completedOrder.orderId || completedOrder.order?.orderid || 'KELO-001'}</strong>
            </div>
            <div className="order-meta-row">
              <span>Total Amount:</span>
              <strong className="order-total-price">₹{completedOrder.calculatedTotal || completedOrder.order?.total_amount || cartTotal}</strong>
            </div>
            <div className="order-meta-row">
              <span>Delivery Contact:</span>
              <span>{completedOrder.order?.phoneno || phone}</span>
            </div>
            {address && (
              <div className="order-meta-row">
                <span>Shipping Address:</span>
                <span>{address}</span>
              </div>
            )}
            {completedOrder.emailStatus?.to && (
              <div className="order-meta-row email-sent-note">
                <span>Confirmation:</span>
                <span>Sent to {completedOrder.emailStatus.to} ✉️</span>
              </div>
            )}
          </div>

          <div className="success-delivery-badge">
            <FaTruck /> Handcrafted & shipped with care in 2–3 business days
          </div>

          <div className="order-actions">
            <Link to="/" className="btn-primary" onClick={() => setCompletedOrder(null)}>
              Explore More Gifts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. Empty Cart Screen ─────────────────────────────────────────────────
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

  // ─── 3. Active Cart & Checkout Form ───────────────────────────────────────
  return (
    <div className="cart-container">
      <div className="cart-header-title">
        <h2>Your Shopping Cart</h2>
        <span className="cart-count-badge">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="cart-content">
        {/* Items List */}
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.product.id} className="cart-item">
              <img src={item.product.imageUrl} alt={item.product.name} className="cart-item-img" />

              <div className="cart-item-details">
                <h3>{item.product.name}</h3>
                <p className="cart-item-cat">{item.product.category}</p>
                <p className="cart-item-price">₹{item.product.price.toFixed(2)}</p>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="qty-btn"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="qty-btn"
                      aria-label="Increase quantity"
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
                <p>₹{(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Panel */}
        <div className="cart-summary">
          <h3>Order & Checkout</h3>
          
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className="free-tag">Free Shipping</span>
          </div>
          <div className="summary-row total">
            <span>Total Payable</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>

          {/* Customer Delivery Form */}
          <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Arjun Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Phone Number <span className="required-star">*</span></label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Email Address (For receipt)</label>
              <input
                type="email"
                placeholder="e.g. arjun@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Delivery / Campus Address</label>
              <textarea
                rows={2}
                placeholder="e.g. Patel Hall of Residence, Room 204, IIT KGP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {checkoutError && (
              <div className="checkout-error-box">
                {checkoutError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-checkout"
            >
              <FaLock /> {isSubmitting ? 'Processing Order...' : `Place Order (₹${cartTotal.toFixed(2)})`}
            </button>
          </form>

          <p className="checkout-note">
            🔒 Secure Direct Checkout • Cash on Delivery / UPI upon arrival.
          </p>
        </div>
      </div>
    </div>
  );
}
