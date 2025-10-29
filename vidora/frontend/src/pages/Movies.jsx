import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import '../App.css'

function Movies({ user }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMovies()
  }, [])

  const loadMovies = () => {
    setTimeout(() => {
      setMovies([
        { id: 1, title: "The Dark Knight", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", year: "2008", genre: "Action" },
        { id: 2, title: "Inception", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", year: "2010", genre: "Sci-Fi" },
        { id: 3, title: "Pulp Fiction", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", year: "1994", genre: "Crime" },
        { id: 4, title: "The Matrix", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", year: "1999", genre: "Sci-Fi" },
        { id: 5, title: "Goodfellas", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", year: "1990", genre: "Crime" },
        { id: 6, title: "The Godfather", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", year: "1972", genre: "Drama" }
      ])
      setLoading(false)
    }, 1000)
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
        <h1 className="section-title">Movies</h1>

        {/* Action */}
        <div className="content-row">
          <h2 className="section-title">Action Movies</h2>
          <div className="content-grid">
            {movies.filter(movie => movie.genre === 'Action').map(movie => (
              <div key={movie.id} className="content-card">
                <img src={movie.image} alt={movie.title} />
                <div className="content-card-overlay">
                  <div className="content-card-title">{movie.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sci-Fi */}
        <div className="content-row">
          <h2 className="section-title">Sci-Fi Movies</h2>
          <div className="content-grid">
            {movies.filter(movie => movie.genre === 'Sci-Fi').map(movie => (
              <div key={movie.id} className="content-card">
                <img src={movie.image} alt={movie.title} />
                <div className="content-card-overlay">
                  <div className="content-card-title">{movie.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Movies */}
        <div className="content-row">
          <h2 className="section-title">All Movies</h2>
          <div className="content-grid">
            {movies.map(movie => (
              <div key={movie.id} className="content-card">
                <img src={movie.image} alt={movie.title} />
                <div className="content-card-overlay">
                  <div className="content-card-title">{movie.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Movies
