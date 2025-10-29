import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import '../App.css'

function MyList({ user }) {
  const [myList, setMyList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadMyList()
    }
  }, [user])

  const loadMyList = () => {
    setTimeout(() => {
      setMyList([
        { id: 1, title: "Stranger Things", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", type: "series", addedDate: "2024-01-15" },
        { id: 2, title: "The Dark Knight", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", type: "movie", addedDate: "2024-01-10" },
        { id: 3, title: "Breaking Bad", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", type: "series", addedDate: "2024-01-08" }
      ])
      setLoading(false)
    }, 1000)
  }

  const removeFromList = (id) => {
    setMyList(myList.filter(item => item.id !== id))
  }

  // redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="content-section">
      <div className="container">
        <h1 className="section-title">My List</h1>

        {myList.length === 0 ? (
          <div className="no-subscriptions">
            <p>Your list is empty</p>
            <p>Add movies and shows to your list to watch them later.</p>
          </div>
        ) : (
          <div className="content-row">
            <div className="content-grid">
              {myList.map(item => (
                <div key={item.id} className="content-card">
                  <img src={item.image} alt={item.title} />
                  <div className="content-card-overlay">
                    <div className="content-card-title">{item.title}</div>
                    <button
                      onClick={() => removeFromList(item.id)}
                      className="btn btn-primary"
                      style={{ marginTop: '8px', fontSize: '12px', padding: '4px 8px' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyList
