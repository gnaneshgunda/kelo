import { useState, useEffect } from 'react';
import './SplashScreen.css';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isShrinking, setIsShrinking] = useState(false);

  useEffect(() => {
    // Only show splash screen once per session
    if (sessionStorage.getItem('splashShown')) {
      setIsVisible(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setIsShrinking(true);
    }, 1500);

    const timer2 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('splashShown', 'true');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`splash-screen ${isShrinking ? 'shrink' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo"></div>
        <h1 className="splash-title">KeLo</h1>
      </div>
    </div>
  );
}
