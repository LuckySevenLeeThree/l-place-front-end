import React, { useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { UserIcon } from './Icons';

function ChatSection({ username, onSendMessage }) {
  const chatContainerRef = useRef(null);
  const { 
    messages, 
    inputMessage, 
    setInputMessage, 
    isChatVisible 
  } = useChat();

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onSendMessage(e);
  };

  return (
    <div 
      className={`chat-section ${!isChatVisible ? 'hidden' : ''}`}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="chat-header">
        <div className="username-display">
          <UserIcon />
          <span>{username}</span>
        </div>
      </div>
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender === username ? 'own-message' : ''}`}
          >
            <span className="sender">{msg.sender}</span>
            <span className="content">{msg.content}</span>
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            maxLength={200}
          />
          <button type="submit">전송</button>
        </form>
      </div>
    </div>
  );
}

export default ChatSection;