import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  texts: string[];
  delay?: number;
  choppy?: boolean;
  pauseBetweenTexts?: number;
  typingSpeed?: number;
}

const TypewriterText = ({ 
  texts, 
  delay = 100, 
  choppy = false, 
  pauseBetweenTexts = 2000,
  typingSpeed = 1
}: TypewriterTextProps) => {
  const [displayText, setDisplayText] = useState('\u00A0');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const typeNextChar = () => {
      const currentText = texts[currentTextIndex];
      
      if (currentIndex <= currentText.length) {
        setDisplayText((currentText.slice(0, currentIndex) || '\u00A0') + '<span class="cursor">|</span>');
        currentIndex++;
        
        const nextDelay = choppy 
          ? (Math.random() * 150 + 50) / typingSpeed 
          : delay / typingSpeed;
          
        timeoutId = setTimeout(typeNextChar, nextDelay);
      } else {
        // Wait for pauseBetweenTexts before starting next text
        timeoutId = setTimeout(() => {
          currentIndex = 0;
          setCurrentTextIndex((prevIndex) => 
            prevIndex === texts.length - 1 ? 0 : prevIndex + 1
          );
          setDisplayText('\u00A0<span class="cursor">|</span>'); // Clear text before starting next one
        }, pauseBetweenTexts);
      }
    };

    typeNextChar();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [texts, delay, choppy, currentTextIndex, pauseBetweenTexts, typingSpeed]);

  return (
    <div className="typewriter-container">
      <style>
        {`
          .cursor {
            animation: blink 1s step-end infinite;
          }
          
          @keyframes blink {
            from, to { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
      <span 
        className='text-white'
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    </div>
  );
};

export default TypewriterText; 