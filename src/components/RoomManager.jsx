import React, { useState } from "react";

const RoomManager = ({ user, onJoinRoom }) => {
  const [activeTab, setActiveTab] = useState("join");
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Use the same API base URL as LoginPage
  const API_BASE_URL = 'https://collaborative-whiteboard-480h.onrender.com';

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/verify-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomCode: roomCode.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setError('Session expired. Please log in again.');
          setTimeout(() => window.location.reload(), 2000);
          setLoading(false);
          return;
        }
        
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorData.error || 'Failed to join room');
      }

      const data = await response.json();
      onJoinRoom({ code: roomCode.trim(), name: data.room.room_name });
      
    } catch (err) {
      console.error('Join room error:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!roomName.trim()) {
      setError('Please enter a room name');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomName: roomName.trim()
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setError('Session expired. Please log in again.');
          setTimeout(() => window.location.reload(), 2000);
          setLoading(false);
          return;
        }
        
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorData.error || 'Failed to create room');
      }

      const data = await response.json();
      onJoinRoom({ code: data.roomCode, name: roomName.trim() });
      
    } catch (err) {
      console.error('Create room error:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="room-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Welcome, {user.username}!</h2>
        <button 
          onClick={handleLogout}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Logout
        </button>
      </div>

      <div className="tab-buttons">
        <button
          className={activeTab === "join" ? "tab-btn active" : "tab-btn"}
          onClick={() => {
            setActiveTab("join");
            setError('');
            setRoomCode('');
          }}
        >
          Join Room
        </button>
        <button
          className={activeTab === "create" ? "tab-btn active" : "tab-btn"}
          onClick={() => {
            setActiveTab("create");
            setError('');
            setRoomName('');
          }}
        >
          Create Room
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {activeTab === "join" ? (
        <form onSubmit={handleJoinRoom} className="form">
          <h3>Join Existing Room</h3>
          <input
            type="text"
            placeholder="Enter Room Code (e.g., ABC123)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading || !roomCode.trim()}>
            {loading ? "Joining..." : "Join Room"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCreateRoom} className="form">
          <h3>Create New Room</h3>
          <input
            type="text"
            placeholder="Enter Room Name (e.g., Team Meeting)"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading || !roomName.trim()}>
            {loading ? "Creating..." : "Create Room"}
          </button>
        </form>
      )}
    </div>
  ); 
};

export default RoomManager;
