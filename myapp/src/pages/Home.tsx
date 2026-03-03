import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import { DUMMY_PRODUCTS, CATEGORIES } from '../data/products';
import './Home.css';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = selectedCategory === 'All'
    ? DUMMY_PRODUCTS
    : DUMMY_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="home-container">
      <div className="hero-section">
        <h2>Welcome to handycrafts!</h2>
        <p>Discover unique, handmade treasures curated just for you.</p>
      </div>

      <div className="filter-section">
        <h3>Categories</h3>
        <div className="category-buttons">
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
        {filteredProducts.length === 0 && (
          <p className="no-products">No products found for this category.</p>
        )}
      </div>
    </div>
  );
}
