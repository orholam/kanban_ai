import React, { useEffect, useState, useRef } from 'react';
import { animate, useMotionValue, motion } from 'framer-motion';

interface StreamingContentProps {
  stream: ReadableStream<Uint8Array>;
  isDarkMode?: boolean;
  className?: string;
  scrollToBottom?: boolean;
}

function useAnimatedText(text: string) {
  const [displayText, setDisplayText] = useState('');
  const textProgress = useMotionValue(0);
  
  useEffect(() => {
    const controls = animate(textProgress, text.length, {
      type: "tween",
      duration: 0.5,
      ease: "linear",
      onUpdate: latest => {
        setDisplayText(text.slice(0, Math.round(latest)));
      }
    });

    return () => controls.stop();
  }, [text]);

  return displayText;
}

export default function StreamingContent({ 
  stream, 
  isDarkMode = false,
  className = '',
  scrollToBottom = true
}: StreamingContentProps) {
  const [content, setContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const animatedText = useAnimatedText(content);

  useEffect(() => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    async function processStream() {
      reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                const newContent = parsed.choices[0]?.delta?.content || '';
                setContent(prev => prev + newContent);
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error reading stream:', error);
      } finally {
        reader.releaseLock();
      }
    }

    processStream();

    return () => {
      if (reader) {
        reader.cancel();
      }
    };
  }, [stream]);

  // Auto-scroll to bottom as content streams in
  useEffect(() => {
    if (scrollToBottom && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [animatedText, scrollToBottom]);

  return (
    <div 
      ref={contentRef}
      className={`
        relative overflow-auto
        ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}
        ${className}
      `}
    >
      <motion.div 
        className="whitespace-pre-wrap"
      >
        {animatedText}
      </motion.div>
    </div>
  );
}
