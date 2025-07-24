import React, { useRef, useEffect, useState } from 'react'
import io from 'socket.io-client'

const Board = ({ user, roomCode, roomName, onLeaveRoom }) => {
  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState('pen')
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#000000')

  useEffect(() => {
    socketRef.current = io('https://test-backend-ozii.onrender.com')
    socketRef.current.emit('join-room', roomCode)

    socketRef.current.on('canvas-data', ({ imageData }) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = imageData
    })

    socketRef.current.on('clear-canvas', () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [roomCode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const maxWidth = Math.min(containerRect.width - 40, 1000)
      const maxHeight = Math.min(containerRect.height - 40, 600)

      canvas.style.width = `${maxWidth}px`
      canvas.style.height = `${maxHeight}px`
      canvas.width = maxWidth
      canvas.height = maxHeight

      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
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
      y: (touch.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)

    const coords = getCanvasCoordinates(e)
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
  }

  const stopDrawing = (e) => {
    e.preventDefault()
    if (!isDrawing) return

    setIsDrawing(false)

    const canvas = canvasRef.current
    if (canvas && socketRef.current) {
      const imageData = canvas.toDataURL()
      socketRef.current.emit('canvas-data', { roomCode, imageData })
    }
  }

  const startDrawingTouch = (e) => {
    e.preventDefault()
    setIsDrawing(true)

    const coords = getTouchCoordinates(e)
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

  const drawTouch = (e) => {
    e.preventDefault()
    if (!isDrawing) return

    const coords = getTouchCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  const stopDrawingTouch = (e) => {
    e.preventDefault()
    if (!isDrawing) return

    setIsDrawing(false)

    const canvas = canvasRef.current
    if (canvas && socketRef.current) {
      const imageData = canvas.toDataURL()
      socketRef.current.emit('canvas-data', { roomCode, imageData })
    }
  }

  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      socketRef.current?.emit('clear-canvas', roomCode)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('mousedown', startDrawing, { passive: false })
    canvas.addEventListener('mousemove', draw, { passive: false })
    canvas.addEventListener('mouseup', stopDrawing, { passive: false })
    canvas.addEventListener('mouseleave', stopDrawing, { passive: false })

    canvas.addEventListener('touchstart', startDrawingTouch, { passive: false })
    canvas.addEventListener('touchmove', drawTouch, { passive: false })
    canvas.addEventListener('touchend', stopDrawingTouch, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseleave', stopDrawing)

      canvas.removeEventListener('touchstart', startDrawingTouch)
      canvas.removeEventListener('touchmove', drawTouch)
      canvas.removeEventListener('touchend', stopDrawingTouch)
    }
  }, [isDrawing, brushColor, brushSize, tool])

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
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
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
          style={{
            cursor: tool === 'eraser' ? 'grab' : 'crosshair',
            touchAction: 'none',
          }}
        />
      </div>
    </div>
  )
}

export default Board
