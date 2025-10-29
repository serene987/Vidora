import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import '../App.css'

function Series({ user }) {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSeries()
    }
  }, [user])

  const loadSeries = () => {
    setTimeout(() => {
      setSeries([
        { id: 1, title: "Breaking Bad", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", seasons: 5, genre: "Drama" },
        { id: 2, title: "Stranger Things", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", seasons: 4, genre: "Sci-Fi" },
        { id: 3, title: "The Office", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", seasons: 9, genre: "Comedy" },
        { id: 4, title: "Game of Thrones", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", seasons: 8, genre: "Fantasy" },
        { id: 5, title: "Friends", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", seasons: 10, genre: "Comedy" },
        { id: 6, title: "The Crown", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", seasons: 6, genre: "Drama" }
      ])
      setLoading(false)
    }, 1000)
  }

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
        <h1 className="section-title">TV Series</h1>

        <div className="content-row">
          <h2 className="section-title">Drama Series</h2>
          <div className="content-grid">
            {series.filter(show => show.genre === 'Drama').map(show => (
              <div key={show.id} className="content-card">
                <img src={show.image} alt={show.title} />
                <div className="content-card-overlay">
                  <div className="content-card-title">{show.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-row">
          <h2 className="section-title">Comedy Series</h2>
          <div className="content-grid">
            {series.filter(show => show.genre === 'Comedy').map(show => (
              <div key={show.id} className="content-card">
                <img src={show.image} alt={show.title} />
                <div className="content-card-overlay">
                  <div className="content-card-title">{show.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-row">
          <h2 className="section-title">All Series</h2>
          <div className="content-grid">
            {series.map(show => (
              <div key={show.id} className="content-card">
                <img src={show.image} alt={show.title} />
                <div className="content-card-overlay">
                  <div className="content-card-title">{show.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Series
