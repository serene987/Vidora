import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../App.css'

function PaymentSuccess() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
      console.log('🔄 SUCCESS PAGE: Verifying payment for session:', sessionId)
      const response = await fetch(`http://localhost:5000/api/checkout-success?session_id=${sessionId}`)
      console.log('📊 SUCCESS PAGE: Response status:', response.status)
      
      const data = await response.json()
      console.log('📝 SUCCESS PAGE: Response data:', data)
      
      if (response.ok) {
        console.log('✅ SUCCESS PAGE: Payment verified successfully')
        setTimeout(() => {
          navigate('/login?message=signup_success')
        }, 2000)
      } else {
        console.error('❌ SUCCESS PAGE: Payment verification failed:', data)
        // If user already exists, redirect to login
        if (data.error && data.error.includes('already exists')) {
          setTimeout(() => {
            navigate('/login?message=account_exists')
          }, 2000)
        } else {
          setError(data.error || 'Payment verification failed')
        }
      }
    } catch (error) {
      console.error('❌ SUCCESS PAGE: Network error:', error)
      setError('Network error during payment verification')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="payment-success-page">
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
      <div className="payment-success-page">
        <div className="container">
          <div className="success-card error">
            <h1>Payment Processing Issue</h1>
            <p>{error}</p>
            <p style={{fontSize: '14px', color: '#666', marginTop: '10px'}}>
              If your payment was successful but you're seeing this error, 
              your account may already be created. Try logging in.
            </p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button 
                onClick={() => navigate('/login')} 
                className="btn btn-primary"
              >
                Try Login
              </button>
              <button 
                onClick={() => navigate('/plans')} 
                className="btn btn-outline"
              >
                Back to Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-success-page">
      <div className="container">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p>Your account has been created successfully.</p>
          <p>You will be redirected to the login page in a few seconds...</p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess