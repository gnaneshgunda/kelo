import { useState, useEffect } from 'react';
import type { Product } from '../types';
import './HallDaysSpecials.css';

interface SpecialOffer extends Product {
  offerText: string;
}

interface Props {
  specials: SpecialOffer[];
}

export default function HallDaysSpecials({ specials }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll the carousel every 4 seconds
  useEffect(() => {
    if (specials.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % specials.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [specials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % specials.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + specials.length) % specials.length);
  };

  if (!specials || specials.length === 0) return null;

  const currentSpecial = specials[currentIndex];

  return (
    <div className="hall-days-carousel-container">
      <div
        className="hall-days-slide"
        style={{ backgroundImage: `url(${currentSpecial.imageUrl})` }}
      >
        <div className="hall-days-overlay">
          <div className="hall-days-content">
            <div className="hall-days-badge-container">
              <span className="hall-days-label">Hall Days Specials</span>
              <span className="hall-days-badge">{currentSpecial.offerText}</span>
            </div>

            <h2 className="hall-days-title">{currentSpecial.name}</h2>
            <p className="hall-days-desc">{currentSpecial.description}</p>

            <div className="hall-days-price-block">
              <span className="hall-original-price">${currentSpecial.price.toFixed(2)}</span>
              <span className="hall-discounted-price">
                ${(currentSpecial.price * 0.8).toFixed(2)}
              </span>
            </div>

            <button className="hall-days-shop-btn">Shop Now</button>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button className="hall-nav-arrow hall-nav-prev" onClick={goToPrev}>
          &#10094;
        </button>
        <button className="hall-nav-arrow hall-nav-next" onClick={goToNext}>
          &#10095;
        </button>

        {/* Navigation Dots */}
        <div className="hall-nav-dots">
          {specials.map((_, idx) => (
            <button
              key={idx}
              className={`hall-nav-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
