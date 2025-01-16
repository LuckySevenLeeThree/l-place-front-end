import React, { createContext, useContext, useState } from 'react';

const CursorContext = createContext(null);

const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
};

export function CursorProvider({ children }) {
  const [cursors, setCursors] = useState({});

  const updateCursor = (username, x, y) => {
    setCursors(prev => ({
      ...prev,
      [username]: {
        x,
        y,
        color: prev[username]?.color || generateRandomColor(),
        timestamp: Date.now()
      }
    }));
  };

  const removeCursor = (username) => {
    setCursors(prev => {
      const newCursors = { ...prev };
      delete newCursors[username];
      return newCursors;
    });
  };

  const value = {
    cursors,
    setCursors,
    updateCursor,
    removeCursor,
  };

  return (
    <CursorContext.Provider value={value}>
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
} 