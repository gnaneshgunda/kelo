import './About.css';

export default function About() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h2>About handycrafts</h2>
        <p className="lead">
          We believe in the power of the handmade. Every piece tells a story of tradition, patience, and creativity.
        </p>
        <p>
          At <strong>handycrafts</strong>, we bring together independent artisans from all over the world.
          Our mission is to celebrate traditional craftsmanship and provide a platform for makers to share
          their unique, high-quality creations directly with you.
        </p>
        <p>
          Whether you're looking for hand-thrown pottery, intricate textiles, or bespoke jewelry,
          you'll find that every item in our store is made with love and attention to detail.
          When you buy from us, you're not just buying a product—you're supporting a real person's passion and livelihood.
        </p>
        <div className="about-values">
          <h3>Our Values</h3>
          <ul>
            <li><strong>Authenticity:</strong> 100% handmade items, no mass production.</li>
            <li><strong>Sustainability:</strong> Supporting eco-friendly materials and ethical practices.</li>
            <li><strong>Community:</strong> Connecting artisans directly with appreciative buyers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
