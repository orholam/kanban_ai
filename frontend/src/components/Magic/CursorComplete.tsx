import React, { useState, useRef, useEffect } from "react";
import { autocompletion } from "../../lib/openai";

interface CursorCompleteProps {
  prompt: string;
  timeToWait: number;
  height?: number; // height of the input box in lines
}

export const CursorComplete = ({ prompt, timeToWait, height }: CursorCompleteProps) => {
  const [userInput, setUserInput] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // handle typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setUserInput(value);
    setCursorPosition(cursorPos);
    setAiSuggestion("");
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // trigger LLM after pause
    timerRef.current = setTimeout(async () => {
      try {
        const fullPrompt = `${prompt}\n\nUser input: ${value}`;
        const response = await autocompletion(fullPrompt);
        
        if (response.choices && response.choices[0]?.message?.content) {
          setAiSuggestion(response.choices[0].message.content);
        }
      } catch (error) {
        console.error("Error generating AI suggestion:", error);
        setAiSuggestion("Error generating suggestion");
      }
    }, timeToWait);
  };

  // handle key presses for accepting suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && aiSuggestion) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const cursorPos = target.selectionStart || 0;
      const newInput = userInput.slice(0, cursorPos) + aiSuggestion + userInput.slice(cursorPos);
      
      setUserInput(newInput);
      setAiSuggestion("");
      
      // Set cursor position after the inserted suggestion
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = cursorPos + aiSuggestion.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPosition(newCursorPos);
        }
      }, 0);
    }
  };





  return (
    <div className="w-full">
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          
          .cursor-complete-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .cursor-complete-scrollbar::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 4px;
          }
          
          .cursor-complete-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          
          .cursor-complete-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}
      </style>
      
      {/* Combined display area */}
      <div
        className="w-full p-2 border rounded bg-white cursor-text relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
        onClick={() => textareaRef.current?.focus()}
        style={{
          fontFamily: "monospace",
          lineHeight: "1.5em",
          height: height ? `${height}px` : "auto",
          minHeight: height ? `${height}px` : "3em",
          maxHeight: height ? `${height}px` : "none",
        }}
      >
        {/* Scrollable content container */}
        <div
          className="w-full h-full overflow-y-auto pr-2 cursor-complete-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e0 #f7fafc",
          }}
        >
          <div
            className="w-full"
            style={{
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
        {/* User input text with cursor */}
        <span className="text-black">
          {userInput.slice(0, cursorPosition)}
          {isFocused && (
            <span 
              className="inline-block w-0.5 h-5 bg-black"
              style={{
                animation: 'blink 1s step-end infinite',
                verticalAlign: 'text-top',
                marginTop: '-1px',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
              }}
            ></span>
          )}
          {userInput.slice(cursorPosition)}
        </span>
        
        {/* AI suggestion text */}
        {aiSuggestion && (
          <span className="text-gray-400 suggestion-text">
            {aiSuggestion}
          </span>
        )}
        
        {/* Hidden textarea for input handling */}
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement;
            setCursorPosition(target.selectionStart || 0);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute opacity-0"
          style={{
            fontFamily: "monospace",
            lineHeight: "1.5em",
            height: "1px",
            width: "1px",
            position: "absolute",
            left: "-9999px",
          }}
        />
          </div>
        </div>
      </div>
    </div>
  );
};