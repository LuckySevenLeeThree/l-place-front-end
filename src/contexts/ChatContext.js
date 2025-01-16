import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);

  const addMessage = (message) => {
    setMessages(prev => {
      const isDuplicate = prev.some(msg =>
        msg.sender === message.sender &&
        msg.content === message.content &&
        Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000
      );
      if (isDuplicate) return prev;
      return [...prev, message];
    });
  };

  const value = {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isChatVisible,
    setIsChatVisible,
    addMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 