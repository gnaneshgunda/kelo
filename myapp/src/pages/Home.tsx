import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import HallDaysSpecials from '../components/HallDaysSpecials';
import { DUMMY_PRODUCTS, CATEGORIES } from '../data/products';
import './Home.css';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Create a subset of existing dummy products for the specials
  const specialOffers = DUMMY_PRODUCTS.slice(0, 4).map(p => ({
    ...p,
    offerText: '20% OFF'
  }));

  const filteredProducts = selectedCategory === 'All'
    ? DUMMY_PRODUCTS
    : DUMMY_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="home-container">
      <HallDaysSpecials specials={specialOffers} />

      <div className="hero-section">
        <h2>Welcome to KeLo!</h2>
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
