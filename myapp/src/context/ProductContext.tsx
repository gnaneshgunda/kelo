import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, SpecialOffer } from '../types';
import { api } from '../services/api';

interface ProductContextType {
  products: Product[];
  specials: SpecialOffer[];
  categories: string[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [specials, setSpecials] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedProducts, fetchedSpecials] = await Promise.all([
        api.getProducts(),
        api.getSpecials(),
      ]);
      setProducts(fetchedProducts);
      setSpecials(fetchedSpecials);
    } catch (err: any) {
      console.error('[ProductContext] Error loading catalog:', err);
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute distinct categories from products and specials
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        specials,
        categories,
        loading,
        error,
        refreshProducts: loadData,
        getProductById,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
