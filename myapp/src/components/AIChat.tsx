import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaCartPlus, FaPlus, FaMinus, FaMagic } from 'react-icons/fa';
import { DUMMY_PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import type { Product } from '../types';
import './AIChat.css';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedProducts?: Product[];
}

const SYSTEM_PROMPT = `You are KELO's friendly shopping assistant. KELO is a handcrafted gifts store run by IIT Kharagpur students.

Here are ALL the products available in the store (this is the complete catalog):
${DUMMY_PRODUCTS.map(p =>
  `- ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: ₹${p.price} | Description: ${p.description.slice(0, 80)}...`
).join('\n')}

Your job:
1. Help customers find the perfect handcrafted product based on their needs (occasion, budget, recipient, etc.)
2. Be warm, friendly and conversational — like a helpful shopkeeper
3. When you want to recommend products, include a special JSON block at the END of your response in this exact format (no other JSON):
   PRODUCTS:["p1","p3"]
4. Only recommend products from the list above. Never invent products.
5. Keep responses concise — 2-3 sentences max, then the product list.
6. If asked about price, always use ₹ (Indian Rupees).
7. Never recommend more than 3 products at once.`;

function parseSuggestions(content: string): { text: string; productIds: string[] } {
  const match = content.match(/PRODUCTS:\[([^\]]*)\]/);
  if (!match) return { text: content, productIds: [] };

  const ids = match[1]
    .split(',')
    .map(s => s.replace(/['"]/g, '').trim())
    .filter(Boolean);

  const text = content.replace(/PRODUCTS:\[[^\]]*\]/, '').trim();
  return { text, productIds: ids };
}

function ProductMiniCard({ product }: { product: Product }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const cartItem = cartItems.find(ci => ci.product.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;

  return (
    <div className="chat-product-card">
      <img src={product.imageUrl} alt={product.name} className="chat-product-img" loading="lazy" />
      <div className="chat-product-info">
        <p className="chat-product-name">{product.name}</p>
        <p className="chat-product-price">₹{product.price.toFixed(2)}</p>
      </div>
      <div className="chat-product-cta" onClick={e => e.stopPropagation()}>
        {qty > 0 ? (
          <div className="chat-qty-row">
            <button className="chat-qty-btn" onClick={() => updateQuantity(product.id, qty - 1)}><FaMinus /></button>
            <span>{qty}</span>
            <button className="chat-qty-btn" onClick={() => updateQuantity(product.id, qty + 1)}><FaPlus /></button>
          </div>
        ) : (
          <button className="chat-add-btn" onClick={() => addToCart(product)}>
            <FaCartPlus /> Add
          </button>
        )}
      </div>
    </div>
  );
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm KELO's shopping assistant. Tell me what you're looking for — an occasion, a budget, or who you're gifting — and I'll find the perfect handcrafted item for you!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Rule-based fallback if no API key
    if (!apiKey) {
      setTimeout(() => {
        const lower = text.toLowerCase();
        let suggested = DUMMY_PRODUCTS.filter(p =>
          lower.includes(p.category.toLowerCase()) ||
          lower.includes(p.name.toLowerCase())
        );
        if (suggested.length === 0) suggested = DUMMY_PRODUCTS.slice(0, 3);

        const ids = suggested.slice(0, 3).map(p => p.id);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Here are some handcrafted items that might interest you! Add your Groq API key to get smarter AI-powered suggestions.`,
          suggestedProducts: suggested.slice(0, 3),
        }]);
        console.info('[KELO Chat] No API key — using rule-based fallback. IDs:', ids);
        setLoading(false);
      }, 600);
      return;
    }

    // Build conversation history for Groq (without our custom suggestedProducts field)
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: text },
          ],
          max_tokens: 300,
          temperature: 0.6,
        }),
      });

      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? '';

      const { text: replyText, productIds } = parseSuggestions(raw);
      const suggested = productIds
        .map(id => DUMMY_PRODUCTS.find(p => p.id === id))
        .filter(Boolean) as Product[];

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: replyText,
        suggestedProducts: suggested.length > 0 ? suggested : undefined,
      }]);
    } catch (err) {
      console.error('[KELO Chat]', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    "Birthday gift under ₹30",
    "Something for my girlfriend",
    "Unique Shinchan card",
    "Gift for a bookworm",
  ];

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        className={`chat-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open KELO AI Assistant"
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
        {!isOpen && <span className="chat-fab-label">Ask AI</span>}
      </button>

      {/* ── Chat panel ── */}
      {isOpen && (
        <div className="chat-panel" role="dialog" aria-label="KELO AI Shopping Assistant">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">
                <FaRobot />
              </div>
              <div>
                <p className="chat-header-name">KELO Assistant</p>
                <p className="chat-header-sub">
                  <span className="chat-online-dot" />
                  Powered by Groq AI
                </p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-wrap ${msg.role}`}>
                <div className={`chat-bubble ${msg.role}`}>
                  <p>{msg.content}</p>
                </div>
                {/* Product cards for suggestions */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="chat-products-row">
                    {msg.suggestedProducts.map(p => (
                      <ProductMiniCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-bubble-wrap assistant">
                <div className="chat-bubble assistant typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestion chips (only show at start) */}
          {messages.length <= 1 && (
            <div className="chat-chips">
              {suggestions.map(s => (
                <button key={s} className="chat-chip" onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                  <FaMagic className="chip-icon" /> {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-row">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="e.g. gift for my mom under ₹50..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              maxLength={200}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
