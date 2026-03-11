import { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen() {
  // Initialize state synchronously to avoid flash of content
  const [isVisible, setIsVisible] = useState(() => !sessionStorage.getItem('hasSeenSplash'));
  const [isShrinking, setIsShrinking] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Mark as seen for future visits in the same session
      sessionStorage.setItem('hasSeenSplash', 'true');

      // Start the shrinking animation after a short delay (e.g., 2 seconds of full screen)
      const shrinkTimer = setTimeout(() => {
        setIsShrinking(true);
      }, 2000);

      // Hide the splash screen completely after the animation finishes
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // 2000ms delay + 1000ms animation duration

      return () => {
        clearTimeout(shrinkTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`splash-container ${isShrinking ? 'shrinking' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-placeholder"></div>
        <h1 className="splash-title">KeLo</h1>
      </div>
    </div>
  );
}
