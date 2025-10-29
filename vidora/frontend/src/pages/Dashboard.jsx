import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import '../App.css'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Skip API call, just use session data
    setLoading(false)
  }, [user])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!currentPassword || !newPassword) {
      setError('Please fill in all fields')
      return
    }
    
    setChangingPassword(true)
    
    try {
      const response = await fetch('http://localhost:5000/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ oldPassword: currentPassword, newPassword })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        alert('Password changed successfully!')
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to change password')
        // Clear error message after 5 seconds
        setTimeout(() => setError(''), 5000)
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }
  
  const handleCancelPlan = async () => {
    if (!confirm('Are you sure you want to cancel your plan?')) {
      return
    }

    setCancelling(true)
    
    try {
      const response = await fetch('http://localhost:5000/api/user/subscriptions/cancel', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()
      
      if (response.ok) {
        // Call logout endpoint
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        })
        
        if (onLogout) {
          onLogout()
        }
        
        alert('Plan cancelled successfully')
      } else {
        setError(data.error || 'Cancellation failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  console.log('📝 DASHBOARD: User state:', user)
  
  if (!user) {
    console.log('❌ DASHBOARD: No user, redirecting to login')
    return <Navigate to="/login" />
  }
  
  console.log('✅ DASHBOARD: User found, rendering dashboard')

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Account</h1>
          {!user.emailVerified && (
            <div className="error-message">
              ⚠️ Please verify your email to access all features
            </div>
          )}
        </div>

        <div className="dashboard-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <section className="profile-section">
            <h2>Profile</h2>
            <div className="profile-card">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.fullName}</p>
              <p><strong>Status:</strong> 
                <span className={user?.emailVerified ? 'verified' : 'unverified'}>
                  {user?.emailVerified ? ' Verified' : ' Unverified'}
                </span>
              </p>
              <p><strong>Payment Status:</strong> 
                <span className={user?.hasPaid ? 'verified' : 'unverified'}>
                  {user?.hasPaid ? ' Paid' : ' Unpaid'}
                </span>
              </p>
            </div>
          </section>

          <section className="password-section">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={changingPassword}
                className="btn btn-primary"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </section>

          <section className="plan-section">
            <h2>Current Plan</h2>
            {!user?.hasPaid ? (
              <div className="no-plan">
                <p>You don't have an active plan.</p>
                <Link to="/plans" className="btn btn-primary">Browse Plans</Link>
              </div>
            ) : (
              <div className="plan-card">
                <div className="plan-header">
                  <h3>Active Subscription</h3>
                  <span className="status active">active</span>
                </div>
                
                <div className="plan-details">
                  <p><strong>Status:</strong> You have an active subscription</p>
                  <p><strong>Access:</strong> Full content library</p>
                </div>
                
                <button 
                  onClick={handleCancelPlan}
                  disabled={cancelling}
                  className="btn btn-outline cancel-btn"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Plan'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard