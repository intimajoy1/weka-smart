// src/SplashScreen.js
import React, { useEffect, useState } from 'react';
import logo from '../logo512.png'; // adjust path if needed
import './SplashScreen.css';

const SplashScreen = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const animationTimeout = setTimeout(() => {
      setAnimate(true);
    }, 100);

    return () => clearTimeout(animationTimeout);
  }, []);

  return (
    <div className="splash-container">
      <img
        src={logo}
        alt="WekaSmart Logo"
        className={`splash-logo ${animate ? 'start-animation' : ''}`}
      />
    </div>
  );
};

export default SplashScreen;
