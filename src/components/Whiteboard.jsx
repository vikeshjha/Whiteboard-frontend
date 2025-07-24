import React, { useState, useRef, useEffect } from 'react'
import io from 'socket.io-client'

const Whiteboard = ({ user, roomCode, roomName, onLeaveRoom }) => {
  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState('pen')
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#000000')
  const [prevCoords, setPrevCoords] = useState({ x: 0, y: 0 })

  const SOCKET_URL = 'https://whiteboard-backend-two.vercel.app/'

  const createCustomCursor = () => {
    if (tool === 'pen') {
      const size = Math.max(brushSize + 4, 12);
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${(size-4)/2}" 
                  fill="none" stroke="black" stroke-width="2"/>
          <circle cx="${size/2}" cy="${size/2}" r="${(size-6)/2}" 
                  fill="rgba(102,126,234,0.3)" stroke="none"/>
          <circle cx="${size/2}" cy="${size/2}" r="1" fill="black"/>
        </svg>
      `;
      return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${size/2} ${size/2}, crosshair`;
    } else if (tool === 'eraser') {
      const size = Math.max(brushSize + 6, 16);
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${(size-4)/2}" 
                  fill="white" stroke="black" stroke-width="2"/>
          <path d="M${size/2-4},${size/2-4} L${size/2+4},${size/2+4} M${size/2+4},${size/2-4} L${size/2-4},${size/2+4}" 
                stroke="red" stroke-width="2"/>
        </svg>
      `;
      return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${size/2} ${size/2}, grab`;
    }
    return 'crosshair';
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    })
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', roomCode);
    });

    socketRef.current.on('drawing-data', (data) => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = data.color
      ctx.lineWidth = data.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over'
      
      ctx.beginPath()
      ctx.moveTo(data.prevX, data.prevY)
      ctx.lineTo(data.currentX, data.currentY)
      ctx.stroke()
    });

    socketRef.current.on('canvas-data', ({ imageData }) => {
      const canvas = canvasRef.current
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = imageData
    });

    socketRef.current.on('clear-canvas', () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [roomCode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = 650
    canvas.height = 450
    canvas.style.width = '650px'
    canvas.style.height = '450px'

    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.cursor = createCustomCursor()
    }
  }, [tool, brushSize, brushColor])

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const getTouchCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas || !e.touches[0]) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const touch = e.touches[0]
    
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    
    const coords = getCanvasCoordinates(e)
    setPrevCoords(coords)
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : brushColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing) return

    const coords = getCanvasCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('drawing-data', {
        roomCode,
        prevX: prevCoords.x,
        prevY: prevCoords.y,
        currentX: coords.x,
        currentY: coords.y,
        color: tool === 'eraser' ? '#FFFFFF' : brushColor,
        size: brushSize,
        tool: tool
      });
    }

    setPrevCoords(coords)
  }

  const stopDrawing = (e) => {
    e.preventDefault()
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    const canvas = canvasRef.current
    if (canvas && socketRef.current && socketRef.current.connected) {
      const imageData = canvas.toDataURL()
      socketRef.current.emit('canvas-data', { roomCode, imageData });
    }
  }

  const handleTouchStart = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    
    const coords = getTouchCoordinates(e)
    setPrevCoords(coords)
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : brushColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!isDrawing) return

    const coords = getTouchCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('drawing-data', {
        roomCode,
        prevX: prevCoords.x,
        prevY: prevCoords.y,
        currentX: coords.x,
        currentY: coords.y,
        color: tool === 'eraser' ? '#FFFFFF' : brushColor,
        size: brushSize,
        tool: tool
      });
    }

    setPrevCoords(coords)
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    const canvas = canvasRef.current
    if (canvas && socketRef.current && socketRef.current.connected) {
      const imageData = canvas.toDataURL()
      socketRef.current.emit('canvas-data', { roomCode, imageData });
    }
  }

  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('clear-canvas', roomCode)
      }
    }
  }

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      onLeaveRoom()
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.reload()
    }
  }

  return (
    <div className="whiteboard-app">
      <div className="room-header">
        <div className="room-info">
          <h2>🎨 {roomName}</h2>
          <p>Room Code: <strong>{roomCode}</strong></p>
          <p>User: <strong>{user.username}</strong></p>
        </div>
        <div className="header-buttons">
          <button className="back-btn" onClick={handleLeaveRoom}>
            ← Back to Rooms
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
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
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          />
          <span>{brushSize}px</span>
        </div>

        <div className="tool-group">
          <button className="tool-btn danger" onClick={clearCanvas}>
            🗑️ Clear Canvas
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
            cursor: createCustomCursor(),
            touchAction: 'none'
          }}
        />
      </div>
    </div>
  )
}

export default Whiteboard
