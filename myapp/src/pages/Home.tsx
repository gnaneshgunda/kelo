import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import HallDaysSpecials from '../components/HallDaysSpecials';
import ProductDetailModal from '../components/ProductDetailModal';
import { useProducts } from '../context/ProductContext';
import type { Product } from '../types';
import './Home.css';

export default function Home() {
  const { products, specials, categories, loading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const handleShopNow = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setModalProduct(product);
    } else {
      // Check if it's a special bundle
      const special = specials.find((s) => s.id === productId || s.productId === productId);
      if (special) {
        setModalProduct({
          id: special.id,
          name: special.name,
          description: special.description || special.tagline || 'Festive special offer',
          price: special.price,
          category: special.category || 'Combos',
          imageUrl: special.imageUrl,
          images: special.images || [special.imageUrl],
        });
      }
    }
  };

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="home-container">
      {/* Dynamic Specials Banner from /api/specials */}
      {specials.length > 0 && (
        <HallDaysSpecials specials={specials} onShopNow={handleShopNow} />
      )}

      {/* Product Detail Modal */}
      {modalProduct && (
        <ProductDetailModal product={modalProduct} onClose={() => setModalProduct(null)} />
      )}

      {/* Category Filter Navigation */}
      <div className="filter-section">
        <h3>Categories</h3>
        <div className="category-buttons">
          {categories.map((category) => (
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

      {/* Dynamic Product Grid */}
      <div className="products-grid">
        {loading && products.length === 0 ? (
          <div className="loading-spinner">Loading handcrafted products...</div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
        {!loading && filteredProducts.length === 0 && (
          <p className="no-products">No products found for this category.</p>
        )}
      </div>
    </div>
  );
}
