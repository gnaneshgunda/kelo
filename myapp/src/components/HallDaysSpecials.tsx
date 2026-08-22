import { useState, useEffect } from 'react';
import './HallDaysSpecials.css';

interface SpecialOffer {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  offerText: string;
  imageUrl: string;
  productId?: string;
}

export default function HallDaysSpecials({ specials, onShopNow }: {
  specials: SpecialOffer[];
  onShopNow?: (productId: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!specials || specials.length === 0) return;
    const interval = setInterval(() => goTo((prev) => (prev + 1) % specials.length), 5000);
    return () => clearInterval(interval);
  }, [specials]);

  if (!specials || specials.length === 0) return null;

  function goTo(indexFn: (prev: number) => number) {
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(indexFn);
      setAnimating(false);
    }, 250);
  }

  const handleNext = () => goTo((prev) => (prev + 1) % specials.length);
  const handlePrev = () => goTo((prev) => (prev === 0 ? specials.length - 1 : prev - 1));

  const current = specials[currentIndex];

  return (
    <div
      className="rakhi-banner"
      style={{ backgroundImage: `url(${current.imageUrl})` }}
    >
      {/* Directional overlay: opaque-cream on left for text, transparent on right for image */}
      <div className="rakhi-overlay" />

      {/* ══ TOP-LEFT: Rakhi decoration ══
          A circular rakhi center + radiating petals + thread curving in from top-left */}
      <svg
        className="rakhi-deco rakhi-deco--tl"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Thread entering from top edge, curving down-right */}
        <path
          d="M30 0 C35 30 55 45 70 60 C85 75 95 90 80 115"
          stroke="#8B3A3A" strokeWidth="1.8" fill="none"
          strokeLinecap="round" opacity="0.55"
        />
        {/* Parallel thread — cream highlight */}
        <path
          d="M36 0 C41 28 60 43 75 58 C90 73 100 88 85 113"
          stroke="#F5E6D0" strokeWidth="0.8" fill="none"
          strokeLinecap="round" opacity="0.45"
        />
        {/* Gold thread alongside */}
        <path
          d="M24 0 C29 32 50 47 65 62 C80 77 90 93 75 118"
          stroke="#B8893A" strokeWidth="0.9" fill="none"
          strokeLinecap="round" strokeDasharray="4 3" opacity="0.40"
        />

        {/* Rakhi center circle — decorative disc */}
        <circle cx="30" cy="28" r="13" fill="#FDF0E4" opacity="0.92"/>
        <circle cx="30" cy="28" r="13" stroke="#B8893A" strokeWidth="1.2" opacity="0.7"/>
        <circle cx="30" cy="28" r="9"  stroke="#8B3A3A" strokeWidth="0.8" strokeDasharray="2.5 2" opacity="0.55"/>
        <circle cx="30" cy="28" r="5"  fill="#C1440E"   opacity="0.30"/>
        <circle cx="30" cy="28" r="3"  fill="#B8893A"   opacity="0.70"/>

        {/* Petal/floral spokes around rakhi center */}
        {[0,45,90,135,180,225,270,315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 30 + 10 * Math.cos(rad);
          const y1 = 28 + 10 * Math.sin(rad);
          const x2 = 30 + 15 * Math.cos(rad);
          const y2 = 28 + 15 * Math.sin(rad);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#B8893A" strokeWidth="1" opacity="0.45" strokeLinecap="round"/>
          );
        })}
        {/* Tiny pearl dots on thread */}
        <circle cx="50" cy="50" r="2.2" fill="#F5E6D0" stroke="#B8893A" strokeWidth="0.7" opacity="0.75"/>
        <circle cx="62" cy="64" r="1.6" fill="#F5E6D0" stroke="#B8893A" strokeWidth="0.6" opacity="0.60"/>
        <circle cx="72" cy="80" r="1.8" fill="#F5E6D0" stroke="#B8893A" strokeWidth="0.6" opacity="0.55"/>

        {/* Tiny gold sparkles */}
        <circle cx="90" cy="18" r="1.2" fill="#B8893A" opacity="0.50"/>
        <circle cx="110" cy="8"  r="0.8" fill="#B8893A" opacity="0.35"/>
        <circle cx="75"  cy="10" r="0.9" fill="#C1440E" opacity="0.30"/>
        <circle cx="130" cy="22" r="1.0" fill="#B8893A" opacity="0.28"/>

        {/* Subtle outer ring — mandala hint */}
        <circle cx="30" cy="28" r="19" stroke="#B8893A" strokeWidth="0.4" strokeDasharray="1.5 4" opacity="0.22"/>
      </svg>

      {/* ══ BOTTOM-RIGHT: Rakhi thread continuation ══ */}
      <svg
        className="rakhi-deco rakhi-deco--br"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Thread entering from bottom edge, curving up-left */}
        <path
          d="M170 200 C165 170 145 155 130 140 C115 125 105 110 120 85"
          stroke="#8B3A3A" strokeWidth="1.8" fill="none"
          strokeLinecap="round" opacity="0.55"
        />
        <path
          d="M164 200 C159 172 140 157 125 142 C110 127 100 112 115 87"
          stroke="#F5E6D0" strokeWidth="0.8" fill="none"
          strokeLinecap="round" opacity="0.45"
        />
        <path
          d="M176 200 C171 168 150 153 135 138 C120 123 110 107 125 82"
          stroke="#B8893A" strokeWidth="0.9" fill="none"
          strokeLinecap="round" strokeDasharray="4 3" opacity="0.40"
        />

        {/* Rakhi center — bottom-right */}
        <circle cx="170" cy="172" r="13" fill="#FDF0E4" opacity="0.92"/>
        <circle cx="170" cy="172" r="13" stroke="#B8893A" strokeWidth="1.2" opacity="0.7"/>
        <circle cx="170" cy="172" r="9"  stroke="#8B3A3A" strokeWidth="0.8" strokeDasharray="2.5 2" opacity="0.55"/>
        <circle cx="170" cy="172" r="5"  fill="#C1440E"   opacity="0.30"/>
        <circle cx="170" cy="172" r="3"  fill="#B8893A"   opacity="0.70"/>

        {[0,45,90,135,180,225,270,315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 170 + 10 * Math.cos(rad);
          const y1 = 172 + 10 * Math.sin(rad);
          const x2 = 170 + 15 * Math.cos(rad);
          const y2 = 172 + 15 * Math.sin(rad);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#B8893A" strokeWidth="1" opacity="0.45" strokeLinecap="round"/>
          );
        })}

        {/* Pearl dots on thread */}
        <circle cx="150" cy="150" r="2.2" fill="#F5E6D0" stroke="#B8893A" strokeWidth="0.7" opacity="0.75"/>
        <circle cx="138" cy="136" r="1.6" fill="#F5E6D0" stroke="#B8893A" strokeWidth="0.6" opacity="0.60"/>
        <circle cx="128" cy="120" r="1.8" fill="#F5E6D0" stroke="#B8893A" strokeWidth="0.6" opacity="0.55"/>

        {/* Sparkles */}
        <circle cx="110" cy="182" r="1.2" fill="#B8893A" opacity="0.50"/>
        <circle cx="90"  cy="192" r="0.8" fill="#B8893A" opacity="0.35"/>
        <circle cx="125" cy="190" r="0.9" fill="#C1440E" opacity="0.30"/>
        <circle cx="70"  cy="178" r="1.0" fill="#B8893A" opacity="0.28"/>

        <circle cx="170" cy="172" r="19" stroke="#B8893A" strokeWidth="0.4" strokeDasharray="1.5 4" opacity="0.22"/>
      </svg>

      {/* ── Content ── */}
      <div className="rakhi-content">
        <button className="rakhi-arrow rakhi-arrow--prev" onClick={handlePrev} aria-label="Previous">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className={`rakhi-card ${animating ? 'rakhi-card--fade' : ''}`}>
          {/* Frosted text panel */}
          <div className="rakhi-text-panel">
            <div className="rakhi-label">
              <span className="rakhi-label__dot" />
              RAKSHA BANDHAN SPECIALS
              <span className="rakhi-label__dot" />
            </div>
            <p className="rakhi-tagline">{current.tagline}</p>
            <h2 className="rakhi-product-name">{current.name}</h2>
            <div className="rakhi-price-row">
              <span className="rakhi-badge">{current.offerText}</span>
              <span className="rakhi-old-price">₹{current.originalPrice.toFixed(2)}</span>
              <span className="rakhi-new-price">₹{current.price.toFixed(2)}</span>
            </div>
            <button className="rakhi-cta" onClick={() => current.productId && onShopNow?.(current.productId)}>
              Shop Now
            </button>
          </div>
        </div>

        <button className="rakhi-arrow rakhi-arrow--next" onClick={handleNext} aria-label="Next">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* ── Dots ── */}
      <div className="rakhi-dots">
        {specials.map((_, idx) => (
          <button
            key={idx}
            className={`rakhi-dot ${idx === currentIndex ? 'rakhi-dot--active' : ''}`}
            onClick={() => goTo(() => idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
