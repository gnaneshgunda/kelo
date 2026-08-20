import { useState, useEffect, useRef } from 'react';
import type { Product, CartItem } from '../types';

interface UseAISuggestionsResult {
  suggestions: Product[];
  loading: boolean;
  error: string | null;
  isAIEnabled: boolean;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';

/**
 * Rule-based fallback: picks products from same category (excluding current),
 * sorted by price proximity, capped at 3.
 */
function getRuleBasedSuggestions(current: Product, all: Product[]): Product[] {
  const sameCategory = all
    .filter((p) => p.id !== current.id && p.category === current.category)
    .sort((a, b) => Math.abs(a.price - current.price) - Math.abs(b.price - current.price));

  if (sameCategory.length >= 2) return sameCategory.slice(0, 3);

  // Broaden to all products if not enough in category
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

  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  const isAIEnabled = !!apiKey;

  // Prevent duplicate calls
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // ── Fallback: no API key ──
    if (!isAIEnabled) {
      setSuggestions(getRuleBasedSuggestions(currentProduct, allProducts));
      return;
    }

    // ── Groq AI call ──
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      const cartSummary = cartItems.map((ci) => ci.product.name).join(', ') || 'empty cart';

      const prompt = `You are a product recommendation assistant for KELO, a handcrafted gifts store from IIT Kharagpur.

Current product the user is viewing:
- Name: ${currentProduct.name}
- Category: ${currentProduct.category}
- Price: ₹${currentProduct.price}

Available products (id: name, category, price):
${allProducts
  .filter((p) => p.id !== currentProduct.id)
  .map((p) => `- ${p.id}: ${p.name} (${p.category}, ₹${p.price})`)
  .join('\n')}

User's cart: ${cartSummary}

Suggest exactly 3 products from the list above that complement the current product or would appeal to someone buying it.
Respond with ONLY a valid JSON array of product IDs, like: ["p2","p4","p6"]
Do not include any explanation or extra text.`;

      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 60,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content?.trim() ?? '[]';

        // Parse the JSON array of IDs
        const ids: string[] = JSON.parse(raw);
        const found = ids
          .map((id) => allProducts.find((p) => p.id === id))
          .filter(Boolean) as Product[];

        // Fallback if AI returns nothing useful
        setSuggestions(found.length > 0 ? found : getRuleBasedSuggestions(currentProduct, allProducts));
      } catch (err) {
        console.warn('[KELO AI] Falling back to rule-based suggestions:', err);
        setError('AI unavailable — showing similar products');
        setSuggestions(getRuleBasedSuggestions(currentProduct, allProducts));
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentProduct.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { suggestions, loading, error, isAIEnabled };
}
