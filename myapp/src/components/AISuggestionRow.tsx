import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { FaCartPlus, FaPlus, FaMinus, FaRobot } from 'react-icons/fa';
import './AISuggestionRow.css';

interface AISuggestionRowProps {
  suggestions: Product[];
  loading: boolean;
  isAIEnabled: boolean;
  onProductClick: (product: Product) => void;
}

export default function AISuggestionRow({
  suggestions,
  loading,
  isAIEnabled,
  onProductClick,
}: AISuggestionRowProps) {
  const { cartItems, addToCart, updateQuantity } = useCart();

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="ai-suggestion-section">
      <div className="ai-suggestion-header">
        <FaRobot className="ai-icon" />
        <h4>
          {isAIEnabled ? 'AI Picks For You' : 'You Might Also Like'}
        </h4>
        {isAIEnabled && <span className="ai-badge">Powered by Groq AI</span>}
      </div>

      <div className="ai-suggestion-row">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="suggestion-skeleton">
                <div className="skeleton-img" />
                <div className="skeleton-text" />
                <div className="skeleton-text short" />
              </div>
            ))
          : suggestions.map((product) => {
              const cartItem = cartItems.find((ci) => ci.product.id === product.id);
              const qty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={product.id}
                  className="suggestion-card"
                  onClick={() => onProductClick(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onProductClick(product)}
                >
                  <div className="suggestion-img-wrap">
                    <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  </div>
                  <div className="suggestion-info">
                    <p className="suggestion-name">{product.name}</p>
                    <p className="suggestion-price">₹{product.price.toFixed(2)}</p>
                  </div>
                  <div className="suggestion-cta" onClick={(e) => e.stopPropagation()}>
                    {qty > 0 ? (
                      <div className="s-qty-row">
                        <button
                          className="s-qty-btn"
                          onClick={() => updateQuantity(product.id, qty - 1)}
                          aria-label="decrease"
                        >
                          <FaMinus />
                        </button>
                        <span>{qty}</span>
                        <button
                          className="s-qty-btn"
                          onClick={() => updateQuantity(product.id, qty + 1)}
                          aria-label="increase"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="s-add-btn"
                        onClick={() => addToCart(product)}
                      >
                        <FaCartPlus /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
