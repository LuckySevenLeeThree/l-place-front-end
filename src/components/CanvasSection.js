import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvas } from '../contexts/CanvasContext';

function CanvasSection({
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onCanvasClick,
  mainCanvasRef
}) {
  const { canvasData, viewport, placedPixels, CANVAS_SIZE, CELL_SIZE } = useCanvas();

  // wheel 이벤트 리스너 추가
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    // wheel 이벤트 핸들러
    const wheelHandler = (e) => {
      e.preventDefault();
      onWheel(e);
    };

    // passive: false 옵션 추가
    canvas.addEventListener('wheel', wheelHandler, { 
      passive: false 
    });
    
    return () => {
      canvas.removeEventListener('wheel', wheelHandler, { 
        passive: false 
      });
    };
  }, [onWheel]);

  // 실제 캔버스를 그리는 함수
  const renderCanvas = useCallback(() => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;

    const context = mainCanvas.getContext('2d');
    if (!context) return;

    // 캔버스 크기 조정
    if (mainCanvas.width !== window.innerWidth || mainCanvas.height !== window.innerHeight) {
      mainCanvas.width = window.innerWidth;
      mainCanvas.height = window.innerHeight;
    }

    context.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    context.imageSmoothingEnabled = false;

    // 스케일링된 셀 크기
    const scaledCellSize = CELL_SIZE / viewport.zoom;
    const totalCanvasWidth = CANVAS_SIZE * scaledCellSize;
    const totalCanvasHeight = CANVAS_SIZE * scaledCellSize;
    const offsetX = (window.innerWidth - totalCanvasWidth) / 2;
    const offsetY = (window.innerHeight - totalCanvasHeight) / 2;

    // 픽셀 렌더링
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const renderX = Math.floor(offsetX + (x - viewport.x) * scaledCellSize);
        const renderY = Math.floor(offsetY + (y - viewport.y) * scaledCellSize);
        const renderSize = Math.max(1, Math.ceil(scaledCellSize));

        const pixel = canvasData[y]?.[x];
        context.fillStyle = pixel?.color || '#ffffff';
        context.fillRect(renderX, renderY, renderSize, renderSize);
      }
    }

    // 픽셀 클릭 시 강조선
    context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    context.lineWidth = 2;
    placedPixels.forEach(pixel => {
      const renderX = Math.floor(offsetX + (pixel.x - viewport.x) * scaledCellSize);
      const renderY = Math.floor(offsetY + (pixel.y - viewport.y) * scaledCellSize);
      const renderSize = Math.max(1, Math.ceil(scaledCellSize));
      context.strokeRect(renderX, renderY, renderSize, renderSize);
    });

  }, [canvasData, viewport, placedPixels, CANVAS_SIZE, CELL_SIZE]);

  // 화면 업데이트 시 매번 캔버스 렌더링
  useEffect(() => {
    requestAnimationFrame(renderCanvas);
  }, [renderCanvas]);

  return (
    <canvas
      ref={mainCanvasRef}
      className="main-canvas"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={onCanvasClick}
    />
  );
}

export default CanvasSection;