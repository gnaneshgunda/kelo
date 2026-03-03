import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { FaCartPlus } from 'react-icons/fa';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product);
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
          <button className="add-to-cart-btn" onClick={handleAdd}>
            <FaCartPlus /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
