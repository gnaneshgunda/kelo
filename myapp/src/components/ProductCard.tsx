import { useState } from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { FaCartPlus, FaPlus, FaMinus, FaStar } from 'react-icons/fa';
import ProductDetailModal from './ProductDetailModal';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const [showDetail, setShowDetail] = useState(false);

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <>
      <div className="product-card" onClick={() => setShowDetail(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setShowDetail(true)}>
        <div className="product-image-container">
          <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
          <span className="product-category-badge">{product.category}</span>
          {product.images && product.images.length > 1 && (
            <span
              className="multi-img-badge"
              style={{
                position: 'absolute',
                bottom: '0.5rem',
                right: '0.5rem',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                backdropFilter: 'blur(4px)',
                zIndex: 2,
              }}
            >
              📷 {product.images.length} photos
            </span>
          )}
          <span className="view-detail-hint">View Details</span>
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          {product.rating && (
            <div className="card-rating">
              <FaStar className="card-star" />
              <span>{product.rating.toFixed(1)}</span>
              {product.reviews && <span className="card-reviews">({product.reviews})</span>}
            </div>
          )}
          <p className="product-description">{product.description}</p>
          <div className="product-bottom-row">
            <span className="product-price">₹{product.price.toFixed(2)}</span>

            {quantity > 0 ? (
              <div className="product-quantity-controls">
                <button className="qty-btn" onClick={handleDecrement} aria-label="Decrease quantity">
                  <FaMinus />
                </button>
                <span className="qty-display">{quantity}</span>
                <button className="qty-btn" onClick={handleIncrement} aria-label="Increase quantity">
                  <FaPlus />
                </button>
              </div>
            ) : (
              <button className="add-to-cart-btn" onClick={handleAdd}>
                <FaCartPlus /> Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {showDetail && (
        <ProductDetailModal product={product} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
