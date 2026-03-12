import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { FaCartPlus, FaPlus, FaMinus } from 'react-icons/fa';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cartItems, addToCart, updateQuantity } = useCart();

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addToCart(product);
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.imageUrl} alt={product.name} className="product-image" />
        <span className="product-category-badge">{product.category}</span>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-bottom-row">
          <span className="product-price">${product.price.toFixed(2)}</span>

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
  );
}
