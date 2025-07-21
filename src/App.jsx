import React, { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import RoomManager from './components/RoomManager'
import Whiteboard from './components/Whiteboard'
import './App.css'

const App = () => {
  const [user, setUser] = useState(null)
  const [currentRoom, setCurrentRoom] = useState(null)

  useEffect(() => {
    
    const token = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleRoomJoin = (userData, roomData) => {
    setCurrentRoom(roomData)
  }

  
  const handleLeaveRoom = () => {
    setCurrentRoom(null)
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentRoom(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  
  if (!user) {
    return (
      <div className="App">
        <LoginPage onLogin={handleLogin} />
      </div>
    )
  }

 
  if (!currentRoom) {
    return (
      <div className="App">
        <RoomManager user={user} onJoinRoom={handleRoomJoin} />
      </div>
    )
  }


  return (
    <div className="App">
      <Whiteboard 
        user={user} 
        roomCode={currentRoom.code}
        roomName={currentRoom.name}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  )
}

export default App
