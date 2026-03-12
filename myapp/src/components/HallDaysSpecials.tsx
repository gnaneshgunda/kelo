import { useState, useEffect } from 'react';
import './HallDaysSpecials.css';

interface SpecialOffer {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  offerText: string;
}

export default function HallDaysSpecials({ specials }: { specials: SpecialOffer[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto scroll effect
  useEffect(() => {
    if (!specials || specials.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % specials.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [specials]);

  if (!specials || specials.length === 0) return null;

  const currentSpecial = specials[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % specials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? specials.length - 1 : prev - 1));
  };

  return (
    <div
      className="hall-specials-banner"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${currentSpecial.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="specials-content">
        <button className="carousel-control prev" onClick={handlePrev}>
          &lt;
        </button>

        <div className="special-card">
          <div className="special-header">
            <h3>HALL DAYS SPECIALS</h3>
            <span className="offer-badge">{currentSpecial.offerText}</span>
          </div>

          <div className="special-details">
            <h2 className="special-product-name">{currentSpecial.name}</h2>
            <div className="special-price">
              <span className="old-price">${(currentSpecial.price * 1.25).toFixed(2)}</span>
              <span className="new-price">${currentSpecial.price.toFixed(2)}</span>
            </div>
            <button className="shop-now-btn">Shop Now</button>
          </div>
        </div>

        <button className="carousel-control next" onClick={handleNext}>
          &gt;
        </button>
      </div>

      <div className="carousel-indicators">
        {specials.map((_, idx) => (
          <span
            key={idx}
            className={`indicator ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
}
