// App.js
import React, { useEffect, useRef, useCallback } from 'react';
import { getRandomNickname } from '@woowa-babble/random-nickname';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

// Context Providers & Hooks
import { CanvasProvider, useCanvas } from './contexts/CanvasContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { CursorProvider, useCursor } from './contexts/CursorContext';

// Components
import Toolbar from './components/Toolbar';
import PaletteControls from './components/PaletteControls';
import ChatSection from './components/ChatSection';
import CursorLayer from './components/CursorLayer';
import CanvasSection from './components/CanvasSection';

// 상수
const CANVAS_SIZE = 256;
const CELL_SIZE = 16;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// 색상 팔레트
const COLOR_PALETTE = [
  '#000000', '#666666', '#0000ff', '#00ff00',
  '#ff0000', '#ffff00', '#ffa500', '#800080',
  '#ffffff', '#333333', '#00ffff', '#008000',
  '#ff69b4', '#ffd700', '#ff4500', 'custom'
];

function AppContent() {
  const usernameRef = useRef('');
  const mainCanvasRef = useRef(null);
  const [isPaletteVisible, setIsPaletteVisible] = React.useState(true);
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const { 
    canvasData, 
    setCanvasData, 
    viewport, 
    setViewport, 
    updateCanvasPixel,
    selectedColor,
    fetchData 
  } = useCanvas();
  
  const { addMessage, setInputMessage, inputMessage } = useChat();
  const { updateCursor, removeCursor } = useCursor();

  // WebSocket 연결 설정
  const { clientRef } = useWebSocket({
    onCanvasMessage: (message) => {
      setCanvasData(prevCanvas => {
        const newCanvas = [...prevCanvas];
        newCanvas[message.y][message.x] = message;
        return newCanvas;
      });
    },
    onChatMessage: addMessage,
    onCursorMessage: (message) => updateCursor(message.username, message.x, message.y),
    onCursorRemoveMessage: (message) => removeCursor(message.username)
  });

  // 초기화
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      usernameRef.current = savedUsername;
    } else {
      const newUsername = getRandomNickname('animals');
      usernameRef.current = newUsername;
      localStorage.setItem('username', newUsername);
    }

    fetchData();
  }, [fetchData]);

  // 유틸: 화면 좌표 -> 캔버스 좌표
  const calculateCursorPosition = useCallback((clientX, clientY, vp) => {
    const scaledCellSize = CELL_SIZE / vp.zoom;
    const totalCanvasWidth = CANVAS_SIZE * scaledCellSize;
    const totalCanvasHeight = CANVAS_SIZE * scaledCellSize;
    const offsetX = (window.innerWidth - totalCanvasWidth) / 2;
    const offsetY = (window.innerHeight - totalCanvasHeight) / 2;

    const x = clientX - offsetX;
    const y = clientY - offsetY;

    return {
      x: vp.x + x / scaledCellSize,
      y: vp.y + y / scaledCellSize
    };
  }, []);

  const getScreenCoords = useCallback((x, y) => {
    const scaledCellSize = CELL_SIZE / viewport.zoom;
    const totalCanvasWidth = CANVAS_SIZE * scaledCellSize;
    const totalCanvasHeight = CANVAS_SIZE * scaledCellSize;
    const offsetX = (window.innerWidth - totalCanvasWidth) / 2;
    const offsetY = (window.innerHeight - totalCanvasHeight) / 2;

    return {
      left: `${(x - viewport.x) * scaledCellSize + offsetX}px`,
      top: `${(y - viewport.y) * scaledCellSize + offsetY}px`
    };
  }, [viewport]);

  // 마우스 휠 (줌)
  const handleWheel = useCallback((e) => {
    if (e.target.closest('.chat-section')) return;
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => {
      const rect = mainCanvasRef.current?.getBoundingClientRect();
      if (!rect) return prev;

      const scaledCellSize = CELL_SIZE / prev.zoom;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const pointX = mouseX / scaledCellSize + prev.x;
      const pointY = mouseY / scaledCellSize + prev.y;

      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * zoomFactor));
      const newScaledCellSize = CELL_SIZE / newZoom;
      const newX = pointX - mouseX / newScaledCellSize;
      const newY = pointY - mouseY / newScaledCellSize;

      const newViewport = {
        zoom: newZoom,
        x: Math.max(-CANVAS_SIZE * 0.1, Math.min(CANVAS_SIZE * 1.1, newX)),
        y: Math.max(-CANVAS_SIZE * 0.1, Math.min(CANVAS_SIZE * 1.1, newY)),
      };

      // 뷰포트 변경 시, 커서 위치도 갱신
      if (clientRef.current?.connected) {
        const cursorPos = calculateCursorPosition(e.clientX, e.clientY, newViewport);
        clientRef.current.publish({
          destination: '/app/cursors',
          body: JSON.stringify({
            username: usernameRef.current,
            x: cursorPos.x,
            y: cursorPos.y
          })
        });
      }

      return newViewport;
    });
  }, [calculateCursorPosition]);

  // 마우스 이동
  const handleMouseMove = useCallback((e) => {
    if (!usernameRef.current || !clientRef.current) return;

    if (isDragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      setViewport(prev => {
        const scaledCellSize = CELL_SIZE / prev.zoom;
        return {
          ...prev,
          x: prev.x - dx / scaledCellSize,
          y: prev.y - dy / scaledCellSize
        };
      });
      dragStart.current = { x: e.clientX, y: e.clientY };
    }

    // 커서 위치 전송
    if (clientRef.current?.connected) {
      const cursorPos = calculateCursorPosition(e.clientX, e.clientY, viewport);
      clientRef.current.publish({
        destination: '/app/cursors',
        body: JSON.stringify({
          username: usernameRef.current,
          x: cursorPos.x,
          y: cursorPos.y
        })
      });
    }
  }, [viewport, calculateCursorPosition]);

  // 마우스 다운
  const handleMouseDown = useCallback((e) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (e.button === 0 && isSpacePressed) {
      isDragging.current = true;
      mainCanvasRef.current?.classList.add('dragging');
    }
  }, [isSpacePressed]);

  // 마우스 업
  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      mainCanvasRef.current?.classList.remove('dragging');
    }
  }, []);

  // 마우스 캔버스 영역 벗어남
  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      mainCanvasRef.current?.classList.remove('dragging');
    }
  }, []);

  // 캔버스 클릭
  const handleCanvasClick = useCallback(async (e) => {
    if (isSpacePressed || isDragging.current) return;
    if (Math.abs(e.clientX - dragStart.current.x) > 5 ||
        Math.abs(e.clientY - dragStart.current.y) > 5) {
      return;
    }

    if (!mainCanvasRef.current) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const scaledCellSize = CELL_SIZE / viewport.zoom;

    const totalCanvasWidth = CANVAS_SIZE * scaledCellSize;
    const totalCanvasHeight = CANVAS_SIZE * scaledCellSize;
    const offsetX = (window.innerWidth - totalCanvasWidth) / 2;
    const offsetY = (window.innerHeight - totalCanvasHeight) / 2;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedX = Math.floor((x - offsetX) / scaledCellSize + viewport.x);
    const clickedY = Math.floor((y - offsetY) / scaledCellSize + viewport.y);

    if (clickedX >= 0 && clickedX < CANVAS_SIZE && clickedY >= 0 && clickedY < CANVAS_SIZE) {
      const pixelDTO = { x: clickedX, y: clickedY, color: selectedColor };
      try {
        await updateCanvasPixel(pixelDTO);
      } catch (error) {
        console.error('픽셀 업데이트 오류:', error);
      }
    }
  }, [isSpacePressed, viewport, selectedColor, updateCanvasPixel]);

  // 채팅 메시지 전송
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !usernameRef.current.trim()) return;

    const message = {
      sender: usernameRef.current.trim(),
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/chat/send',
        body: JSON.stringify(message),
      });
      setInputMessage('');
    }
  }, [inputMessage, setInputMessage]);

  // 스페이스바 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        document.body.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // wheel 이벤트 핸들러를 컨테이너에 직접 추가
  useEffect(() => {
    const container = document.querySelector('.app-container');
    if (!container) return;

    const wheelHandler = (e) => {
      if (e.target.closest('.chat-section')) return;
      e.preventDefault();
      handleWheel(e);
    };

    container.addEventListener('wheel', wheelHandler, { 
      passive: false 
    });

    return () => {
      container.removeEventListener('wheel', wheelHandler, { 
        passive: false 
      });
    };
  }, [handleWheel]);

  return (
    <div
      className="app-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <CanvasSection
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onCanvasClick={handleCanvasClick}
        mainCanvasRef={mainCanvasRef}
      />

      <CursorLayer
        usernameRef={usernameRef}
        getScreenCoords={getScreenCoords}
      />

      <Toolbar />

      <PaletteControls
        isPaletteVisible={isPaletteVisible}
        togglePalette={() => setIsPaletteVisible(!isPaletteVisible)}
        colorPalette={COLOR_PALETTE}
      />

      <ChatSection
        username={usernameRef.current}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

function App() {
  return (
    <CanvasProvider>
      <ChatProvider>
        <CursorProvider>
          <AppContent />
        </CursorProvider>
      </ChatProvider>
    </CanvasProvider>
  );
}

export default App;