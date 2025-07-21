import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const Board = ({ user, roomCode, roomName, onLeaveRoom }) => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');

  useEffect(() => {
  
    socketRef.current = io('http://localhost:3000');
    
  
    socketRef.current.emit('join-room', roomCode);
    

    socketRef.current.on('canvas-data', ({ imageData }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = imageData;
    });

 
    socketRef.current.on('clear-canvas', () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomCode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

 
    const setCanvasSize = () => {
      const container = canvas.parentElement;
      const containerRect = container.getBoundingClientRect();
      
  
      const targetWidth = Math.min(containerRect.width - 40, 1000);
      const targetHeight = Math.min(containerRect.height - 40, 600);
      
 
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = targetWidth + 'px';
      canvas.style.height = targetHeight + 'px';
      
     
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    return () => window.removeEventListener('resize', setCanvasSize);
  }, []);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
 
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    socketRef.current?.emit('canvas-data', {
      room: roomCode,
      imageData
    });
  };

  
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
 
      socketRef.current?.emit('clear-canvas', roomCode);
    }
  };

  return (
    <div className="whiteboard-app">
      <div className="room-header">
        <div className="room-info">
          <h2>🎨 {roomName}</h2>
          <p>Room Code: <strong>{roomCode}</strong></p>
          <p>User: <strong>{user.username}</strong></p>
        </div>
        <button className="logout-btn" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="tools">
        <div className="tool-group">
          <span>Tool:</span>
          <button
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
          >
            🖊️ Pen
          </button>
          <button
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
          >
            🧹 Eraser
          </button>
        </div>

        <div className="tool-group">
          <span>Color:</span>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            disabled={tool === 'eraser'}
          />
        </div>

        <div className="tool-group">
          <span>Size:</span>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
          />
          <span>{brushSize}px</span>
        </div>

        <div className="tool-group">
          <button className="tool-btn danger" onClick={clearCanvas}>
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            cursor: tool === 'eraser' ? 'grab' : 'crosshair',
            touchAction: 'none' 
          }}
        />
      </div>
    </div>
  );
};

export default Board;
