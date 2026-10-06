import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaCartPlus, FaPlus, FaMinus, FaMagic } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { api } from '../services/api';
import type { Product } from '../types';
import ProductDetailModal from './ProductDetailModal';
import './AIChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedProducts?: Product[];
}

function ProductMiniCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const cartItem = cartItems.find((ci) => ci.product.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;

  return (
    <div className="chat-product-card" onClick={onClick}>
      <img src={product.imageUrl} alt={product.name} className="chat-product-img" loading="lazy" />
      <div className="chat-product-info">
        <p className="chat-product-name">{product.name}</p>
        <p className="chat-product-price">₹{product.price.toFixed(2)}</p>
      </div>
      <div className="chat-product-cta" onClick={(e) => e.stopPropagation()}>
        {qty > 0 ? (
          <div className="chat-qty-row">
            <button className="chat-qty-btn" onClick={() => updateQuantity(product.id, qty - 1)}>
              <FaMinus />
            </button>
            <span>{qty}</span>
            <button className="chat-qty-btn" onClick={() => updateQuantity(product.id, qty + 1)}>
              <FaPlus />
            </button>
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
  const { products } = useProducts();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm KELO's shopping assistant. Tell me what you're looking for — an occasion, a budget, or who you're gifting — and I'll find the perfect handcrafted item for you!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Call Cloudflare Workers AI via api.ts
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.sendAIChat(history, products);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
          suggestedProducts: response.suggestedProducts.length > 0 ? response.suggestedProducts : undefined,
        },
      ]);
    } catch (err) {
      console.error('[KELO AI Chat]', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🙏",
        },
      ]);
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
    "Birthday gift under ₹300",
    "Something for my sister / Rakhi",
    "Memory heart photo frame",
    "Special romantic gift combo",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        className={`chat-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open KELO AI Assistant"
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
        {!isOpen && <span className="chat-fab-label">Ask AI</span>}
      </button>

      {/* Chat Panel */}
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
                  Powered by KELO Artisan AI
                </p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <FaTimes />
            </button>
          </div>

          {/* Messages List */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-wrap ${msg.role}`}>
                <div className={`chat-bubble ${msg.role}`}>
                  <p>{msg.content}</p>
                </div>
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="chat-products-row">
                    {msg.suggestedProducts.map((p) => (
                      <ProductMiniCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="chat-bubble-wrap assistant">
                <div className="chat-bubble assistant typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 1 && (
            <div className="chat-chips">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="chat-chip"
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                >
                  <FaMagic className="chip-icon" /> {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="chat-input-row">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Ask for gift suggestions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  );
}
