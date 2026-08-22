import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import HallDaysSpecials from '../components/HallDaysSpecials';
import ProductDetailModal from '../components/ProductDetailModal';
import { DUMMY_PRODUCTS, CATEGORIES } from '../data/products';
import specialsData from '../data/specials.json';
import './Home.css';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalProduct, setModalProduct] = useState<typeof DUMMY_PRODUCTS[0] | null>(null);

  const handleShopNow = (productId: string) => {
    const product = DUMMY_PRODUCTS.find(p => p.id === productId);
    if (product) setModalProduct(product);
  };

  const specialOffers = specialsData;

  const filteredProducts = selectedCategory === 'All'
    ? DUMMY_PRODUCTS
    : DUMMY_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="home-container">
      <HallDaysSpecials specials={specialOffers} onShopNow={handleShopNow} />

      {modalProduct && (
        <ProductDetailModal product={modalProduct} onClose={() => setModalProduct(null)} />
      )}

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
