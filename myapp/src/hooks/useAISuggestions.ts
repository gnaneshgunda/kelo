import { useState, useEffect, useRef } from 'react';
import type { Product, CartItem } from '../types';
import { api } from '../services/api';

interface UseAISuggestionsResult {
  suggestions: Product[];
  loading: boolean;
  error: string | null;
  isAIEnabled: boolean;
}

/**
 * Rule-based fallback: picks products from same category (excluding current),
 * sorted by price proximity, capped at 3.
 */
function getRuleBasedSuggestions(current: Product, all: Product[]): Product[] {
  const sameCategory = all
    .filter((p) => p.id !== current.id && p.category === current.category)
    .sort((a, b) => Math.abs(a.price - current.price) - Math.abs(b.price - current.price));

  if (sameCategory.length >= 2) return sameCategory.slice(0, 3);

  return all
    .filter((p) => p.id !== current.id)
    .sort((a, b) => Math.abs(a.price - current.price) - Math.abs(b.price - current.price))
    .slice(0, 3);
}

export function useAISuggestions(
  currentProduct: Product,
  allProducts: Product[],
  cartItems: CartItem[]
): UseAISuggestionsResult {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState(true);

  // Prevent duplicate calls
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Query Cloudflare Workers AI backend
        const result = await api.getAISuggestions(currentProduct, cartItems);

        if (result.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
          setIsAIEnabled(result.isAI);
        } else {
          setSuggestions(getRuleBasedSuggestions(currentProduct, allProducts));
          setIsAIEnabled(false);
        }
      } catch (err) {
        console.warn('[KELO AI] Falling back to rule-based suggestions:', err);
        setError('Showing complementary handcrafted pieces');
        setSuggestions(getRuleBasedSuggestions(currentProduct, allProducts));
        setIsAIEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentProduct.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { suggestions, loading, error, isAIEnabled };
}
