import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import './Home.css'

function Home({ user }) {
  const [featuredContent, setFeaturedContent] = useState([])
  const [trendingContent, setTrendingContent] = useState([])

  useEffect(() => {
    // Mock data for demonstration
    setFeaturedContent([
      { id: 1, title: "Stranger Things", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", type: "series" },
      { id: 2, title: "The Crown", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", type: "series" },
      { id: 3, title: "Ozark", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", type: "series" }
    ])
    
    setTrendingContent([
      { id: 4, title: "Breaking Bad", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", type: "series" },
      { id: 5, title: "The Office", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", type: "series" },
      { id: 6, title: "Friends", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", type: "series" },
      { id: 7, title: "Game of Thrones", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400", type: "series" }
    ])
  }, [])

  if (!user) {
    return (
      <div className="home">
        <section className="hero">
          <div className="hero-content">
            <h1>Unlimited movies, TV shows, and more.</h1>
            <p>Watch anywhere. Cancel anytime.</p>
            <div className="hero-buttons">
              <Link to="/plans" className="btn btn-primary">Get Started</Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Stranger Things</h1>
          <p>When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.</p>
          <div className="hero-buttons">
            <button className="btn btn-primary">▶ Play</button>
            <button className="btn btn-secondary">+ My List</button>
          </div>
        </div>
      </section>

      <div className="content-section">
        <div className="container">
          <div className="content-row">
            <h2 className="section-title">Trending Now</h2>
            <div className="content-grid">
              {trendingContent.map(item => (
                <div key={item.id} className="content-card">
                  <img src={item.image} alt={item.title} />
                  <div className="content-card-overlay">
                    <div className="content-card-title">{item.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="content-row">
            <h2 className="section-title">Popular on Vidora</h2>
            <div className="content-grid">
              {featuredContent.map(item => (
                <div key={item.id} className="content-card">
                  <img src={item.image} alt={item.title} />
                  <div className="content-card-overlay">
                    <div className="content-card-title">{item.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home