import type { Product } from '../types';
import './HallDaysSpecials.css';

interface SpecialOffer extends Product {
  offerText: string;
}

interface Props {
  specials: SpecialOffer[];
}

export default function HallDaysSpecials({ specials }: Props) {
  return (
    <div className="hall-days-section">
      <div className="hall-days-header">
        <h2>Hall Days Specials</h2>
        <p>Celebrate with these limited time offers!</p>
      </div>
      <div className="hall-days-scroll-container">
        <div className="hall-days-scroll-track">
          {specials.map(product => (
            <div key={product.id} className="special-card">
              <div className="special-image-container">
                <img src={product.imageUrl} alt={product.name} />
                <div className="special-badge">{product.offerText}</div>
              </div>
              <div className="special-info">
                <h4>{product.name}</h4>
                <p className="special-price">
                  <span className="original-price">${product.price.toFixed(2)}</span>
                  <span className="discounted-price">
                    ${(product.price * 0.8).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
