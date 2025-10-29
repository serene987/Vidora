import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import '../App.css'
import './Plans.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

function Plans({ user }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'payment_processing_failed') {
      setError('Payment processing failed. Please try again.')
    }
  }, [searchParams])

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      } else {
        setError('Failed to load plans. Please try again later.')
      }
    } catch (error) {
      setError('Unable to connect to server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId) => {
    if (user) {
      // Existing user - create subscription
      console.log('🚀 FRONTEND: Creating subscription for existing user:', user.id, 'plan:', planId)
      setSubscribing(planId)
      try {
        console.log('🔄 FRONTEND: Making request to existing-user endpoint...')
        const response = await fetch('http://localhost:5000/api/checkout/existing-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ planId })
        })
        
        console.log('📊 FRONTEND: Response status:', response.status)
        const data = await response.json()
        console.log('📝 FRONTEND: Response data:', data)
        
        if (response.ok) {
          console.log('✅ FRONTEND: Redirecting to Stripe:', data.url)
          window.location.href = data.url
        } else {
          console.error('❌ FRONTEND: Error response:', data)
          setError(data.error || 'Failed to create subscription')
        }
      } catch (error) {
        console.error('❌ FRONTEND: Network error:', error)
        setError('Network error. Please try again.')
      } finally {
        setSubscribing(null)
      }
      return
    }

    // New user signup flow - navigate to checkout
    const selectedPlan = plans.find(plan => plan.id === planId)
    if (selectedPlan) {
      navigate('/checkout', { state: { selectedPlan } })
    } else {
      setError('Plan not found')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="plans-page">
      <div className="container">
        <div className="plans-header">
          <h1>{user ? 'Choose the plan that\'s right for you' : 'Sign Up & Choose Your Plan'}</h1>
          <p className="plans-subtitle">{user ? 'Join millions of viewers and enjoy unlimited streaming' : 'Create your account and start streaming today'}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="plans-container">
          {plans.map(plan => (
            <div key={plan.id} className="plan-card">
              <div className="plan-content">
                <div className="plan-header">
                  <h3>{plan.title}</h3>
                  <div className="plan-price">
                    <span className="price">{plan.price}₹</span>
                    <span className="period">/{plan.billingCycle}</span>
                  </div>
                </div>
                
                <p className="plan-description">{plan.description}</p>
                
                <div className="plan-features">
                  <ul>
                    {plan.id === 1 && (
                      <>
                        <li>{plan.channelCount} Essential Channels</li>
                        <li>HD Streaming</li>
                        <li>Mobile Device </li>
                      </>
                    )}
                    {plan.id === 2 && (
                      <>
                        <li>{plan.channelCount} Premium Channels</li>
                        <li>4K Ultra HD Streaming</li>
                        <li>Mobile and Desktop</li>
                      </>
                    )}
                    {plan.id === 3 && (
                      <>
                        <li>{plan.channelCount} All Channels</li>
                        <li>4K + HDR Streaming</li>
                        <li>Unlimited Devices</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="plan-button">
                <button 
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={subscribing === plan.id}
                  className="btn btn-primary full-width"
                >
                  {subscribing === plan.id ? 'Processing...' : (user ? 'Subscribe' : 'Select & Continue')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Plans