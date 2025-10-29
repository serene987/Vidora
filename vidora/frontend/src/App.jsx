import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'

// Components
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Plans from './pages/Plans'
import Checkout from './pages/Checkout'
import Success from './pages/Success'
import Dashboard from './pages/Dashboard'
import Movies from './pages/Movies'
import Series from './pages/Series'
import MyList from './pages/MyList'
import Upgrade from './pages/Upgrade'
import TestStripe from './pages/TestStripe'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Device detection
  const isDesktop = window.innerWidth >= 768
  
  // Check if user has basic plan and is on desktop
  const shouldRedirectToUpgrade = (user) => {
    return user && user.planId === 1 && isDesktop
  }
  
  // Protected route wrapper for basic plan users
  const ProtectedRoute = ({ children }) => {
    if (shouldRedirectToUpgrade(user)) {
      return <Navigate to="/upgrade" replace />
    }
    return children
  }

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      console.log('🔄 APP: Checking session...')
      const response = await fetch('http://localhost:5000/api/auth/check-session', {
        credentials: 'include'
      })
      console.log('📊 APP: Session check response:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ APP: Session data received:', data)
        setUser(data.user)
      } else {
        console.log('❌ APP: No valid session found')
      }
    } catch (error) {
      console.error('❌ APP: Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} logout={logout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/movies" element={<ProtectedRoute><Movies user={user} /></ProtectedRoute>} />
            <Route path="/series" element={<ProtectedRoute><Series user={user} /></ProtectedRoute>} />
            <Route path="/my-list" element={<ProtectedRoute><MyList user={user} /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} onLogout={logout} /></ProtectedRoute>} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/plans" element={<Plans user={user} />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success user={user} setUser={setUser} />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/test-stripe" element={<TestStripe />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
