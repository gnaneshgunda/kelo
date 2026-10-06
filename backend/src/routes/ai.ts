import { Router, Request, Response } from 'express';
import { query } from '../db';
import { Product } from '../types';
import { config } from '../config';

export const aiRouter = Router();

// Helper to format products for AI
function formatRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    category: row.category || 'Decor',
    imageUrl: row.image_url,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [row.image_url]),
    rating: row.rating ? Number(row.rating) : 5.0,
    reviews: row.reviews ? Number(row.reviews) : 1,
    highlights: typeof row.highlights === 'string' ? JSON.parse(row.highlights) : (row.highlights || []),
    material: row.material,
    dimensions: row.dimensions,
    deliveryInfo: row.delivery_info,
    isActive: row.is_active !== false,
  };
}

// POST /api/ai/chat
aiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, currentProducts } = req.body;
    const prodRes = await query('SELECT * FROM products WHERE is_active = TRUE LIMIT 20');
    const catalog = prodRes.rows.map(formatRow);

    const lastMsg = Array.isArray(messages)
      ? messages.slice().reverse().find((m: any) => m.role === 'user')?.content?.toLowerCase() || ''
      : '';

    // If Groq key is present, attempt live call
    if (config.groqApiKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: `You are KELO's warm shopping assistant at IIT Kharagpur. We craft artisan gifts (frames, scrapbooks, hampers, bracelets). Available catalog: ${JSON.stringify(
                  catalog.map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category }))
                )}. Recommend 1-3 matching products warmly. Keep answers under 3 sentences.`,
              },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const replyText = data.choices?.[0]?.message?.content || '';

          // Match mentioned products
          const matched = catalog.filter(
            (p) =>
              replyText.toLowerCase().includes(p.name.toLowerCase()) ||
              replyText.toLowerCase().includes(p.category.toLowerCase()) ||
              lastMsg.includes(p.name.toLowerCase()) ||
              lastMsg.includes(p.category.toLowerCase())
          );

          res.json({
            success: true,
            content: replyText,
            suggestedProducts: matched.length > 0 ? matched.slice(0, 3) : catalog.slice(0, 2),
          });
          return;
        }
      } catch (e) {
        console.warn('[AI Chat] Groq API fallback to heuristic:', e);
      }
    }

    // Smart semantic heuristic
    let matched = catalog.filter((p) => {
      const matchName = lastMsg.includes(p.name.toLowerCase());
      const matchCat = lastMsg.includes(p.category.toLowerCase());
      const matchDesc = lastMsg.split(' ').some((word: string) => word.length > 3 && p.description.toLowerCase().includes(word));
      return matchName || matchCat || matchDesc;
    });

    if (matched.length === 0) {
      if (lastMsg.includes('under') || lastMsg.includes('budget') || lastMsg.includes('cheap')) {
        matched = catalog.filter((p) => p.price <= 350).sort((a, b) => a.price - b.price);
      } else if (lastMsg.includes('love') || lastMsg.includes('romantic') || lastMsg.includes('heart')) {
        matched = catalog.filter((p) => p.name.toLowerCase().includes('heart') || p.category.toLowerCase().includes('decor'));
      } else {
        matched = catalog.slice(0, 3);
      }
    }

    res.json({
      success: true,
      content: `I recommend these beautiful handcrafted pieces for you! Each is made with love right here on campus. ✨`,
      suggestedProducts: matched.slice(0, 3),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'AI assistant error' });
  }
});

// POST /api/ai/suggestions
aiRouter.post('/suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentProduct } = req.body;
    const prodRes = await query('SELECT * FROM products WHERE is_active = TRUE');
    const all = prodRes.rows.map(formatRow);

    const filtered = all.filter((p) => p.id !== currentProduct?.id);
    let matched = filtered.filter((p) => p.category === currentProduct?.category);

    if (matched.length < 2) {
      matched = filtered.sort((a, b) => Math.abs(a.price - (currentProduct?.price || 0)) - Math.abs(b.price - (currentProduct?.price || 0)));
    }

    res.json({
      success: true,
      suggestions: matched.slice(0, 3),
      provider: 'kelo-recommendation-engine',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate suggestions' });
  }
});
