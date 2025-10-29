import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import '../App.css'
import './Login.css'

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingUser, setPendingUser] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'signup_success') {
      setSuccessMessage('Account created successfully! Please sign in with your credentials.')
    } else if (message === 'account_exists') {
      setError('Account already exists. Please sign in.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.isPending) {
          setPendingUser(data.pendingUser)
        } else {
          setUser(data.user)
          navigate('/movies')
        }
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinuePlan = () => {
    navigate(`/checkout?planId=${pendingUser.planId}`)
  }

  const handleChooseNewPlan = () => {
    navigate('/plans')
  }

  if (pendingUser) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h2>Welcome Back, {pendingUser.fullName}!</h2>
          <div className="pending-user-info">
            <p>We found your previous subscription:</p>
            <div className="plan-info">
              <h3>{pendingUser.planTitle}</h3>
              <p>Price: ${pendingUser.planPrice}/month</p>
            </div>
            <p>Would you like to continue with this plan or choose a different one?</p>
            <div className="button-group">
              <button onClick={handleContinuePlan} className="btn btn-primary">
                Continue with {pendingUser.planTitle}
              </button>
              <button onClick={handleChooseNewPlan} className="btn btn-outline">
                Choose Different Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Sign In</h2>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary full-width">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-link">
          New to Vidora? <Link to="/plans">Sign up now</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
