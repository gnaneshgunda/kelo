import { FaFacebook, FaInstagram } from 'react-icons/fa';
import './footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <p>&copy; {new Date().getFullYear()} KeLo. All rights reserved.</p>
          <a href="#/admin" className="admin-portal-link" style={{ marginLeft: '1rem', color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none' }}>
            🔒 Admin Portal
          </a>
        </div>
        <div className="footer-right">
          <a href="https://www.instagram.com/kelo.keylove/" target="_blank" rel="noopener noreferrer" className="social-icon">
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
