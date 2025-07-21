import React, { useState } from 'react'

const LoginPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '' 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (error) setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

  
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
       
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin(data.user)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error. Please check your connection.')
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

   
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      setLoading(false)
      return
    }

    if (!formData.email.match(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)) {
      setError('Email must be in Gmail format: xyz@gmail.com')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setActiveTab('login')
        setFormData({ username: '', email: '', password: '' })
        setError('')
        alert('Registration successful! Please login with your credentials.')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Network error. Please check your connection.')
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <h1>🎨 Collaborative Whiteboard</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-container">
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login')
              setError('')
              setFormData({ username: '', email: '', password: '' })
            }}
          >
            Login
          </button>
          <button 
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register')
              setError('')
              setFormData({ username: '', email: '', password: '' })
            }}
          >
            Register
          </button>
        </div>

        {activeTab === 'login' ? (
          <form className="form" onSubmit={handleLogin}>
            <h2>Welcome Back!</h2>
            <input
              type="text"
              name="username"
              placeholder="Username or Email"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleRegister}>
            <h2>Create Account</h2>
            <input
              type="text"
              name="username"
              placeholder="Username (min 3 characters)"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email (must be @gmail.com)"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
