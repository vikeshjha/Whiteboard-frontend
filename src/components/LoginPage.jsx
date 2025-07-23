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

  const API_BASE_URL = 'https://collaborative-whiteboard-480h.onrender.com'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          throw new Error(`Server error: ${response.status}`)
        }
        throw new Error(errorData.error || `Login failed: ${response.status}`)
      }

      const data = await response.json()
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user)
      
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.username.trim().length < 3) {
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
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          throw new Error(`Server error: ${response.status}`)
        }
        throw new Error(errorData.error || `Registration failed: ${response.status}`)
      }

      setActiveTab('login')
      setFormData({ username: '', email: '', password: '' })
      setError('')
      alert('Registration successful! Please login with your credentials.')
      
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <h1>🎨 Collaborative Whiteboard</h1>
      <div className="form-container">
        <div className="tab-buttons">
          <button
            className={activeTab === 'login' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => {
              setActiveTab('login')
              setError('')
              setFormData({ username: '', email: '', password: '' })
            }}
          >
            Login
          </button>
          <button
            className={activeTab === 'register' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => {
              setActiveTab('register')
              setError('')
              setFormData({ username: '', email: '', password: '' })
            }}
          >
            Register
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="form">
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
          <form onSubmit={handleRegister} className="form">
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
            <div className="email-input-wrapper">
              <input
                type="email"
                name="email"
                placeholder="Email (xyz@gmail.com)"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
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
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
