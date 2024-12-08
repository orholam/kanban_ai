import React, { useEffect, useState } from 'react';
import { animate, useMotionValue, motion } from 'framer-motion';

interface AnimatedTextProps {
  content: string;
  isDarkMode: boolean;
  className?: string;
  onComplete?: () => void;
  delay?: number;
  speed?: number;
}

function useAnimatedText(text: string, delay: number = 0, speed: number = 1, isDarkMode: boolean) {
  const [displayText, setDisplayText] = useState('');
  const textProgress = useMotionValue(0);
  
  useEffect(() => {
    const controls = animate(textProgress, text.length, {
      type: "tween",
      duration: (text.length * 0.03) / speed,
      ease: "linear",
      delay: delay / 1000,
      onUpdate: latest => {
        setDisplayText(text.slice(0, Math.round(latest)));
      }
    });

    return () => controls.stop();
  }, [text, delay, speed]);

  return displayText;
}

export default function AnimatedText({ 
  content,
  isDarkMode = false,
  className = '',
  onComplete,
  delay = 0,
  speed = 1
}: AnimatedTextProps) {
  const animatedText = useAnimatedText(content, delay, speed, isDarkMode);

  useEffect(() => {
    if (animatedText === content && onComplete) {
      onComplete();
    }
  }, [animatedText, content, onComplete]);

  return (
    <div 
      className={`
        relative
        ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}
        ${className}
      `}
    >
      <motion.div className="whitespace-pre-wrap">
        {animatedText}
      </motion.div>
    </div>
  );
}