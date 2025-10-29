import { useState } from 'react'

function TestStripe() {
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runTest = async () => {
    setLoading(true)
    setError('')
    setTestResults(null)
    
    try {
      const response = await fetch('http://localhost:5000/api/test/stripe-data')
      const data = await response.json()
      
      if (response.ok) {
        setTestResults(data)
        console.log('🧪 TEST RESULTS:', data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (error) {
      setError('Network error: ' + error.message)
      console.error('❌ TEST ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Stripe Data Test</h1>
      
      <button 
        onClick={runTest} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#E50914', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Run Stripe Data Test'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '20px', padding: '10px', backgroundColor: '#ffebee' }}>
          Error: {error}
        </div>
      )}

      {testResults && (
        <div style={{ marginTop: '20px' }}>
          <h2>Test Results</h2>
          
          <div style={{ marginBottom: '30px' }}>
            <h3>Users ({testResults.users.total} total)</h3>
            <p>✅ With Stripe Customer ID: {testResults.users.withStripeCustomerId}</p>
            <p>❌ Without Stripe Customer ID: {testResults.users.withoutStripeCustomerId}</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Stripe Customer ID</th>
                </tr>
              </thead>
              <tbody>
                {testResults.users.data.map(user => (
                  <tr key={user.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.fullName}</td>
                    <td style={{ 
                      border: '1px solid #ddd', 
                      padding: '8px',
                      color: user.stripeCustomerId === 'NOT SET' ? 'red' : 'green'
                    }}>
                      {user.stripeCustomerId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3>Subscriptions ({testResults.subscriptions.total} total)</h3>
            <p>✅ With Stripe Subscription ID: {testResults.subscriptions.withStripeSubscriptionId}</p>
            <p>❌ Without Stripe Subscription ID: {testResults.subscriptions.withoutStripeSubscriptionId}</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>User Email</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Plan</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Stripe Subscription ID</th>
                </tr>
              </thead>
              <tbody>
                {testResults.subscriptions.data.map(sub => (
                  <tr key={sub.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{sub.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{sub.userEmail}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{sub.planTitle}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{sub.status}</td>
                    <td style={{ 
                      border: '1px solid #ddd', 
                      padding: '8px',
                      color: sub.stripeSubscriptionId === 'NOT SET' ? 'red' : 'green'
                    }}>
                      {sub.stripeSubscriptionId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestStripe