import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import '../App.css'
import './Navbar.css'

function Navbar({ user, logout }) {
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      logout()
    }
  }
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          VIDORA
        </Link>
        
        {user && (
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            <Link to="/movies" className={`nav-link ${isActive('/movies') ? 'active' : ''}`}>Movies</Link>
            <Link to="/series" className={`nav-link ${isActive('/series') ? 'active' : ''}`}>Series</Link>
            <Link to="/my-list" className={`nav-link ${isActive('/my-list') ? 'active' : ''}`}>My List</Link>
          </div>
        )}
        
        <div className="nav-right">
          {user ? (
            <>
              <div className="user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user.fullName?.charAt(0).toUpperCase()}
                </div>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link to="/dashboard">Dashboard</Link>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Sign In</Link>
              <Link to="/plans" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar