import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../App.css'

function Success({ user, setUser }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      setError('Invalid payment session')
      setLoading(false)
      return
    }

    handlePaymentSuccess(sessionId)
  }, [searchParams])

  const handlePaymentSuccess = async (sessionId) => {
    try {
      console.log('🚀 SUCCESS: Processing payment for session:', sessionId)
      const response = await fetch(`http://localhost:5000/api/checkout-success?session_id=${sessionId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ SUCCESS: Payment processed successfully:', data)
        setSuccess(true)
        
        if (user) {
          // Existing user - refresh session and redirect to dashboard
          console.log('🔄 SUCCESS: Refreshing session for existing user...')
          try {
            const sessionResponse = await fetch('http://localhost:5000/api/auth/refresh-session', {
              credentials: 'include'
            })
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json()
              setUser(sessionData.user)
              console.log('✅ SUCCESS: Session refreshed, redirecting to dashboard')
            }
          } catch (err) {
            console.error('❌ SUCCESS: Failed to refresh session:', err)
          }
          
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        } else {
          // New user - redirect to login
          console.log('🔄 SUCCESS: New user, redirecting to login')
          setTimeout(() => {
            navigate('/login?message=signup_success')
          }, 3000)
        }
      } else {
        const data = await response.json()
        console.error('❌ SUCCESS: Payment verification failed:', data)
        setError(data.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('❌ SUCCESS: Payment verification error:', error)
      setError('Network error during payment verification')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="success-page">
        <div className="container">
          <div className="success-card">
            <div className="loading">
              <div className="spinner"></div>
            </div>
            <h1>Processing your payment...</h1>
            <p>Please wait while we verify your payment and create your account.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="success-page">
        <div className="container">
          <div className="success-card error">
            <h1>Payment Error</h1>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/plans')} 
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="success-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>{user ? 'Your subscription has been activated successfully!' : 'Your account has been created successfully.'}</p>
            <p>{user ? 'You will be redirected to your dashboard...' : 'You will be redirected to the login page in a few seconds...'}</p>
            <button 
              onClick={() => navigate(user ? '/dashboard' : '/login')} 
              className="btn btn-primary"
            >
              {user ? 'Go to Dashboard' : 'Go to Login'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default Success