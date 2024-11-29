import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KanbanBoard from './pages/KanbanBoard';
import NewProject from './pages/NewProject';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <BrowserRouter>
      <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isDarkMode={isDarkMode} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<KanbanBoard isDarkMode={isDarkMode} />} />
              <Route path="/new-project" element={<NewProject isDarkMode={isDarkMode}/>} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
