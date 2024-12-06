import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Week {
  title: string;
  description: string;
}

interface WeekOverviewProps {
  weeks: Week[];
  isDarkMode?: boolean;
}

export default function WeekOverview({ weeks, isDarkMode = false }: WeekOverviewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollPosition = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full">
      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className={`
          absolute left-2 top-1/2 -translate-y-1/2 z-10 
          p-2 rounded-full shadow-lg transition-all duration-200
          ${isDarkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
            : 'bg-white hover:bg-gray-50 text-gray-800'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => scroll('right')}
        className={`
          absolute right-2 top-1/2 -translate-y-1/2 z-10 
          p-2 rounded-full shadow-lg transition-all duration-200
          ${isDarkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
            : 'bg-white hover:bg-gray-50 text-gray-800'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Weeks Container */}
      <div 
        ref={scrollContainerRef}
        className={`
          flex gap-6 overflow-x-auto hide-scrollbar px-12 py-6 snap-x snap-mandatory
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{ scrollbarWidth: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {weeks.map((week, index) => (
          <div
            key={index}
            className={`
              flex-none w-[400px] p-6 rounded-xl shadow-lg snap-center
              transition-all duration-200 hover:shadow-xl select-none
              ${index === 0 
                ? 'gradient-border' 
                : isDarkMode 
                  ? 'border border-gray-700' 
                  : 'border border-gray-200'
              }
              ${isDarkMode 
                ? 'bg-gray-800 text-white' 
                : 'bg-white text-gray-800'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={`
                inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${isDarkMode 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
                }
              `}>
                {index + 1}
              </span>
              <h3 className="text-xl font-bold">{week.title}</h3>
            </div>
            <p className={`
              text-sm leading-relaxed
              ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
            `}>
              {week.description}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .gradient-border {
          background: ${isDarkMode ? '#1f2937' : '#ffffff'};
          position: relative;
          border: double 2px transparent;
          border-radius: 0.75rem;
          background-image: linear-gradient(${isDarkMode ? '#1f2937' : '#ffffff'}, ${isDarkMode ? '#1f2937' : '#ffffff'}),
                          linear-gradient(to right, rgb(79, 70, 229), rgb(147, 51, 234));
          background-origin: border-box;
          background-clip: padding-box, border-box;
        }
      `}</style>
    </div>
  );
}
