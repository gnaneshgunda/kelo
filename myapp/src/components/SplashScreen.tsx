import { useState, useEffect } from 'react';
import keloLogo from '../assets/kelo_logo.jpeg';
import './SplashScreen.css';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(() => !sessionStorage.getItem('splashShown'));
  const [isShrinking, setIsShrinking] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => {
      setIsShrinking(true);
    }, 1800);

    const timer2 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('splashShown', 'true');
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`splash-screen ${isShrinking ? 'shrink' : ''}`}>
      <div className="splash-content">
        <img src={keloLogo} alt="KELO Logo" className="splash-logo-img" />
        <div className="splash-text-block">
          <h1 className="splash-title">KELO</h1>
          <p className="splash-subtitle">The key to your unexpressed love</p>
        </div>
      </div>
    </div>
  );
}
