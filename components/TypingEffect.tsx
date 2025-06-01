"use client";

import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number; // Typing speed in milliseconds per character
  delay?: number; // Delay before starting typing
  className?: string; // Optional className for styling
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 50,
  delay = 0,
  className
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const startTyping = () => {
      timeoutId = setTimeout(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else {
          // Typing finished
        }
      }, speed);
    };

    // Initial delay before starting typing
    if (delay > 0 && currentIndex === 0) {
       timeoutId = setTimeout(startTyping, delay);
    } else {
       startTyping();
    }

    // Cleanup function to clear the timeout if the component unmounts or props change
    return () => clearTimeout(timeoutId);

  }, [text, speed, delay, currentIndex]); // Re-run effect if text, speed, delay, or index changes

  return <span className={className}>{displayText}</span>;
};

export default TypingEffect; 