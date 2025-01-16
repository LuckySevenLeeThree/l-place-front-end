import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchCanvasData, updatePixel } from '../services/apiService';

const CanvasContext = createContext(null);

const CANVAS_SIZE = 256;
const CELL_SIZE = 16;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function CanvasProvider({ children }) {
  const [canvasData, setCanvasData] = useState(
    Array.from({ length: CANVAS_SIZE }, () => Array(CANVAS_SIZE).fill(null))
  );
  const [viewport, setViewport] = useState({
    x: CANVAS_SIZE / 2 - CANVAS_SIZE / 4,
    y: CANVAS_SIZE / 2 - CANVAS_SIZE / 4,
    zoom: 2,
  });
  const [placedPixels, setPlacedPixels] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#ff0000');

  const fetchData = async () => {
    try {
      const initialCanvas = await fetchCanvasData(CANVAS_SIZE);
      setCanvasData(initialCanvas);
    } catch (error) {
      console.error('캔버스 데이터 가져오기 오류:', error);
    }
  };

  const updateCanvasPixel = useCallback(async (pixelDTO) => {
    try {
      const updatedPixel = await updatePixel(pixelDTO);
      if (updatedPixel) {
        setCanvasData(prevCanvas => {
          const newCanvas = [...prevCanvas];
          newCanvas[pixelDTO.y][pixelDTO.x] = updatedPixel;
          return newCanvas;
        });

        setPlacedPixels(prev => [...prev, { x: pixelDTO.x, y: pixelDTO.y }]);
        setTimeout(() => {
          setPlacedPixels(prev => 
            prev.filter(p => !(p.x === pixelDTO.x && p.y === pixelDTO.y))
          );
        }, 1000);
      }
      return updatedPixel;
    } catch (error) {
      console.error('픽셀 업데이트 오류:', error);
      throw error;
    }
  }, []);

  const value = {
    canvasData,
    setCanvasData,
    viewport,
    setViewport,
    placedPixels,
    selectedColor,
    setSelectedColor,
    fetchData,
    updateCanvasPixel,
    CANVAS_SIZE,
    CELL_SIZE,
    MIN_ZOOM,
    MAX_ZOOM,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
} 