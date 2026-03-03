import { FaFacebook, FaInstagram } from 'react-icons/fa';
import './footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <p>&copy; {new Date().getFullYear()} handycrafts. All rights reserved.</p>
        </div>
        <div className="footer-right">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FaInstagram />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FaFacebook />
          </a>
        </div>
      </div>
    </footer>
  );
}
