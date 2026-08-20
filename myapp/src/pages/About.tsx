import { FaInstagram } from 'react-icons/fa';
import './About.css';

export default function About() {
  return (
    <div className="about-container">

      {/* ── Hero ── */}
      <div className="about-hero">
        <div className="hero-text">
          <h1>KELO</h1>
          <p className="tagline">The Key to Your Locked Feelings</p>
          <p className="hero-sub">Crafted at IIT Kharagpur, delivered with heart.</p>
        </div>
      </div>

      {/* ── Origin Story ── */}
      <section className="about-section">
        <div className="content-grid">
          <div className="text-content">
            <h2>Our Origin Story</h2>
            <p>
              Born in the dorms of <strong>IIT Kharagpur</strong>, KeLo started with a simple
              observation: some of the deepest human emotions are the hardest to put into words.
              We realized that handmade crafts could serve as a bridge — a tangible way to
              express what's inside.
            </p>
            <p>
              What started as a student project has grown into a mission to empower handmade
              artistry. Every product you see is crafted by us, ensuring that the "key" you give
              is as unique as the feeling it unlocks.
            </p>
          </div>
          <div className="about-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80"
              alt="Handcrafting at KGP"
            />
            <p className="img-caption">Handcrafting memories at the heart of KGP.</p>
          </div>
        </div>
      </section>

      {/* ── Philosophy ── */}
      <section className="philosophy-section">
        <div className="philosophy-card">
          <span className="philosophy-eyebrow">Why the name?</span>
          <h3>Why "KeLo"?</h3>
          <p>
            The name <strong>KeLo</strong> is derived from our belief that our products are the{' '}
            <strong>"Key to your Locked feelings."</strong> Whether it's gratitude, love, or an
            apology, our specially crafted pieces help you say what you've been holding back.
          </p>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="about-values">
        <h3 className="values-title">What Drives Us</h3>
        <div className="values-grid">
          <div className="value-item">
            <div className="value-icon">🛠️</div>
            <strong>Student-Made</strong>
            <p>Directly designed and crafted by IIT KGP students, blending innovation with tradition.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">💝</div>
            <strong>Emotional Connection</strong>
            <p>Every piece is tailored to maximise likability and emotional resonance for the recipient.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">🤝</div>
            <strong>Empowering Craft</strong>
            <p>Creating a sustainable platform for handmade products in a world of mass production.</p>
          </div>
        </div>
      </section>

      {/* ── Instagram Section ── */}
      <section className="instagram-section">
        <div className="instagram-inner">
          <div className="insta-left">
            <FaInstagram className="insta-big-icon" />
            <div>
              <h3 className="insta-handle">@kelo.keylove</h3>
              <p className="insta-tagline">Follow our journey on Instagram</p>
              <div className="insta-stats">
                <span><strong>320</strong> Followers</span>
                <span><strong>32</strong> Posts</span>
              </div>
            </div>
          </div>
          <a
            href="https://www.instagram.com/kelo.keylove/"
            target="_blank"
            rel="noopener noreferrer"
            className="insta-follow-btn"
          >
            <FaInstagram />
            Follow on Instagram
          </a>
        </div>
        <p className="insta-desc">
          Peek behind the scenes — watch our crafts come to life, get first looks at new
          collections, and share your KeLo moments with us.
        </p>
      </section>

      {/* ── Join callout ── */}
      <div className="team-callout">
        <h3>Join Our Journey</h3>
        <p>Support a student-led initiative and find the key to your next expression.</p>
        <a
          href="https://www.instagram.com/kelo.keylove/"
          target="_blank"
          rel="noopener noreferrer"
          className="callout-insta-link"
        >
          <FaInstagram /> @kelo.keylove
        </a>
      </div>

    </div>
  );
}