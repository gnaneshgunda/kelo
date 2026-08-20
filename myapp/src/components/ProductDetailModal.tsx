import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import {
  FaStar, FaStarHalfAlt, FaRegStar, FaCartPlus, FaPlus, FaMinus,
  FaTimes, FaChevronLeft, FaChevronRight, FaTruck, FaShieldAlt, FaUndo
} from 'react-icons/fa';
import { DUMMY_PRODUCTS } from '../data/products';
import { useAISuggestions } from '../hooks/useAISuggestions';
import AISuggestionRow from './AISuggestionRow';
import './ProductDetailModal.css';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push(<FaStar key={i} className="star filled" />);
    else if (i - rating < 1) stars.push(<FaStarHalfAlt key={i} className="star half" />);
    else stars.push(<FaRegStar key={i} className="star empty" />);
  }
  return <div className="star-row">{stars}</div>;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [added, setAdded] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>(product);

  const { suggestions, loading: suggestionsLoading, isAIEnabled } = useAISuggestions(
    currentProduct,
    DUMMY_PRODUCTS,
    cartItems
  );

  const handleSuggestionClick = useCallback((p: Product) => {
    setCurrentProduct(p);
    setActiveImg(0);
    setAdded(false);
  }, []);

  const cartItem = cartItems.find((item) => item.product.id === currentProduct.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handlePrevImg = () => setActiveImg((p) => (p === 0 ? currentAllImages.length - 1 : p - 1));
  const handleNextImg = () => setActiveImg((p) => (p + 1) % currentAllImages.length);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleAdd = () => {
    addToCart(currentProduct);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleIncrement = () => updateQuantity(currentProduct.id, quantity + 1);
  const handleDecrement = () => updateQuantity(currentProduct.id, quantity - 1);

  // Derived values that should use currentProduct
  const currentAllImages = currentProduct.images && currentProduct.images.length > 0
    ? currentProduct.images
    : [currentProduct.imageUrl];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        <div className="modal-body">
          {/* ─── LEFT: Image Gallery ─── */}
          <div className="modal-gallery">
            {/* Thumbnails column */}
            <div className="thumbnail-strip">
              {currentAllImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumb-btn ${idx === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(idx)}
                >
                  <img src={img} alt={`${product.name} view ${idx + 1}`} />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div className="main-image-wrapper">
              <button className="img-nav prev" onClick={handlePrevImg} aria-label="Previous image">
                <FaChevronLeft />
              </button>
              <div
                className={`main-image-zoom ${zoom ? 'zoomed' : ''}`}
                onMouseEnter={() => setZoom(true)}
                onMouseLeave={() => setZoom(false)}
                onMouseMove={handleMouseMove}
                style={zoom ? { backgroundImage: `url(${currentAllImages[activeImg]})`, backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
              >
                {!zoom && (
                  <img src={currentAllImages[activeImg]} alt={currentProduct.name} className="main-img" />
                )}
                {!zoom && <span className="zoom-hint">Hover to zoom</span>}
              </div>
              <button className="img-nav next" onClick={handleNextImg} aria-label="Next image">
                <FaChevronRight />
              </button>

              {/* Dots */}
              <div className="image-dots">
                {currentAllImages.map((_, idx) => (
                  <span
                    key={idx}
                    className={`img-dot ${idx === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Product Info ─── */}
          <div className="modal-info">
            <span className="modal-category-tag">{currentProduct.category}</span>
            <h2 className="modal-product-name">{currentProduct.name}</h2>

            {/* Rating */}
            {currentProduct.rating && (
              <div className="modal-rating-row">
                <StarRating rating={currentProduct.rating} />
                <span className="rating-value">{currentProduct.rating.toFixed(1)}</span>
                {currentProduct.reviews && (
                  <span className="review-count">({currentProduct.reviews.toLocaleString()} reviews)</span>
                )}
              </div>
            )}

            <div className="modal-divider" />

            {/* Price */}
            <div className="modal-price-row">
              <span className="modal-price">₹{currentProduct.price.toFixed(2)}</span>
              <span className="modal-original-price">₹{(currentProduct.price * 1.2).toFixed(2)}</span>
              <span className="modal-discount-badge">20% OFF</span>
            </div>

            {/* Description */}
            <p className="modal-description">{currentProduct.description}</p>

            {/* Highlights */}
            {currentProduct.highlights && currentProduct.highlights.length > 0 && (
              <div className="modal-highlights">
                <h4>Product Highlights</h4>
                <ul>
                  {currentProduct.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specs */}
            {(currentProduct.material || currentProduct.dimensions) && (
              <div className="modal-specs">
                {currentProduct.material && (
                  <div className="spec-row">
                    <span className="spec-label">Material</span>
                    <span className="spec-value">{currentProduct.material}</span>
                  </div>
                )}
                {currentProduct.dimensions && (
                  <div className="spec-row">
                    <span className="spec-label">Dimensions</span>
                    <span className="spec-value">{currentProduct.dimensions}</span>
                  </div>
                )}
              </div>
            )}

            {/* Delivery info */}
            <div className="modal-delivery-row">
              <FaTruck className="delivery-icon" />
              <span>{currentProduct.deliveryInfo ?? 'Ships within 2–3 business days'}</span>
            </div>

            <div className="modal-divider" />

            {/* CTA */}
            <div className="modal-cta">
              {quantity > 0 ? (
                <div className="modal-qty-controls">
                  <button className="qty-btn-lg" onClick={handleDecrement}><FaMinus /></button>
                  <span className="qty-value">{quantity}</span>
                  <button className="qty-btn-lg" onClick={handleIncrement}><FaPlus /></button>
                </div>
              ) : (
                <button className={`modal-add-btn ${added ? 'added' : ''}`} onClick={handleAdd}>
                  <FaCartPlus />
                  {added ? 'Added!' : 'Add to Cart'}
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div className="trust-badges">
              <div className="trust-badge">
                <FaShieldAlt className="badge-icon" />
                <span>100% Handmade</span>
              </div>
              <div className="trust-badge">
                <FaTruck className="badge-icon" />
                <span>Free Shipping ₹500+</span>
              </div>
              <div className="trust-badge">
                <FaUndo className="badge-icon" />
                <span>Easy Returns</span>
              </div>
            </div>

            {/* ─── AI Suggestions ─── */}
            <AISuggestionRow
              suggestions={suggestions}
              loading={suggestionsLoading}
              isAIEnabled={isAIEnabled}
              onProductClick={handleSuggestionClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
