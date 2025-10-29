import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../App.css'

function Checkout() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const plan = location.state?.selectedPlan
    if (!plan) {
      navigate('/plans')
      return
    }
    setSelectedPlan(plan)
  }, [location.state, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('🔄 FRONTEND: Starting checkout submission...');
    console.log('📋 FRONTEND: Form data:', { 
      email, 
      password: '***', 
      fullName, 
      selectedPlan: selectedPlan ? { id: selectedPlan.id, title: selectedPlan.title } : null 
    });
    
    if (!email || !password) {
      console.log('❌ FRONTEND: Missing email or password');
      setError('Please fill in all fields')
      return
    }

    if (!selectedPlan) {
      console.log('❌ FRONTEND: No plan selected');
      setError('No plan selected')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔄 FRONTEND: Making API request to create checkout session...');
      const requestData = {
        email,
        password,
        planId: selectedPlan.id,
        fullName: fullName || email.split('@')[0]
      };
      console.log('📋 FRONTEND: Request data:', { ...requestData, password: '***' });
      
      const response = await fetch('http://localhost:5000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      console.log('📊 FRONTEND: Response status:', response.status);
      console.log('📊 FRONTEND: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ FRONTEND: Error response text:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          console.error('❌ FRONTEND: Parsed error data:', errorData);
          setError(errorData.details ? `${errorData.error}: ${errorData.details}` : errorData.error)
        } catch (parseError) {
          console.error('❌ FRONTEND: Failed to parse error response:', parseError);
          setError(`Server error (${response.status}): ${responseText}`);
        }
        return
      }

      const responseData = await response.json();
      console.log('✅ FRONTEND: Success response:', responseData);
      
      const { url } = responseData;
      if (url) {
        console.log('🔄 FRONTEND: Redirecting to Stripe checkout:', url);
        window.location.href = url;
      } else {
        console.error('❌ FRONTEND: No URL in response');
        setError('No checkout URL received from server');
      }
    } catch (error) {
      console.error('❌ FRONTEND: Network/fetch error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(`Network error: ${error.message}`);
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/plans')
  }

  if (!selectedPlan) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <button onClick={handleBack} className="back-button">← Back to Plans</button>
          <h1>Complete Your Subscription</h1>
        </div>

        <div className="checkout-content">
          <div className="plan-summary">
            <h2>Selected Plan</h2>
            <div className="plan-details">
              <h3>{selectedPlan.title}</h3>
              <p className="plan-price">₹{selectedPlan.price}/{selectedPlan.billingCycle}</p>
              <p className="plan-description">{selectedPlan.description}</p>
            </div>
          </div>

          <div className="checkout-form">
            <h2>Create Your Account</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="form-group">
                <label>Full Name (Optional)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary full-width"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>
            
            <small style={{ color: '#666', fontSize: '12px', marginTop: '10px', display: 'block', textAlign: 'center' }}>
              You'll be redirected to Stripe to complete payment with test card: 4242 4242 4242 4242
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout