import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import "react-datepicker/dist/react-datepicker.css";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <KanbanBoard />
      </div>
    </div>
  );
}

export default App;
