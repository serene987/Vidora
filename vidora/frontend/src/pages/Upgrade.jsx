import { useNavigate } from 'react-router-dom'
import '../App.css'

function Upgrade() {
  const navigate = useNavigate()

  return (
    <div className="upgrade-page">
      <div className="container">
        <div className="upgrade-content">
          <h1>Upgrade Required</h1>
          <p>Your current plan only supports mobile viewing. Please upgrade to access content on desktop devices.</p>
          
          <div className="upgrade-actions">
            <button 
              onClick={() => navigate('/plans')} 
              className="btn btn-primary"
            >
              View Plans & Upgrade
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upgrade