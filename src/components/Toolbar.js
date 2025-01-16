// src/components/Toolbar.jsx
import React from 'react';
import { useChat } from '../contexts/ChatContext';
import { ChatCloseIcon, ChatIcon } from './Icons';

function Toolbar() {
  const { isChatVisible, setIsChatVisible } = useChat();

  return (
    <div className="toolbar">
      <div className="logo">
        <span className="l">l</span>
        <span className="slash">/</span>
        <span className="place">place</span>
      </div>
      <button
        className={`icon-button toggle-chat ${!isChatVisible ? 'chat-hidden' : ''}`} 
        onClick={() => setIsChatVisible(!isChatVisible)}
        title={isChatVisible ? '채팅 숨기기' : '채팅 보기'}
      >
        {isChatVisible ? <ChatCloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
}

export default Toolbar;