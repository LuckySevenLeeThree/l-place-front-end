import React, { useRef, useEffect } from 'react';
import { UserIcon } from './Icon';

function ChatSection({
  isChatVisible,
  username,
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
  onChatScroll,
  onUsernameClick,
  chatContainerRef,
  onTypingStateChange
}) {
  // 새 메시지가 올 때마다 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 키 이벤트 핸들러 추가
  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.stopPropagation();
    }
  };

  // 입력 필드 focus 상태 관리
  const handleInputFocus = () => {
    onTypingStateChange(true);
  };

  const handleInputBlur = () => {
    onTypingStateChange(false);
  };

  return (
    <div 
      className={`chat-section ${!isChatVisible ? 'hidden' : ''}`}
      onWheel={onChatScroll}
    >
      <div className="chat-header">
        <div 
          className="username-display"
          onClick={onUsernameClick}
        >
          <UserIcon />
          <span>{username || '사용자 이름 설정'}</span>
        </div>
      </div>
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender === username ? 'own-message' : ''}`}
          >
            <span className="sender">{msg.sender}</span>
            <span className="content" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
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
        <form onSubmit={onSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
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