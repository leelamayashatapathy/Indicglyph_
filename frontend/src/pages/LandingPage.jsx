import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSkeleton from '../components/LoadingSkeleton'
import '../styles/LandingPage.css'

function LandingPage() {
  const [homepageContent, setHomepageContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHomepageContent()
  }, [])

  const fetchHomepageContent = async () => {
    try {
      const response = await fetch('/api/homepage/content')
      if (!response.ok) {
        throw new Error('Failed to load homepage content')
      }
      const data = await response.json()
      setHomepageContent(data)
    } catch (err) {
      console.error('Error loading homepage content:', err?.message)
      setError('We are having trouble loading the homepage right now. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading-state">
          <LoadingSkeleton lines={4} width="70%" />
        </div>
      </div>
    )
  }

  const { hero, testimonials, sponsors, footer } = homepageContent || {}

  return (
    <div className="landing-page">
      <nav className="landing-navbar">
        <div className="nav-container">
          <div className="brand">
            <span className="brand-indic">Indic</span><span className="brand-glyph">Glyph</span>
            <span className="brand-studio">Data Studio</span>
          </div>
          <div className="nav-actions">
            <ThemeToggle />
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {error && <ErrorBanner message={error} />}

      <section className="hero-section">
        <div className="hero-background">
          <div className="animated-glyph"></div>
          <div className="gradient-overlay"></div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            {hero?.heading || 'Crowdsourcing AI & OCR Data Review for Indian Languages & Beyond'}
          </h1>
          <p className="hero-subtitle">
            {hero?.subheading || 'Build the future of multilingual AI -- one word, glyph, and voice at a time.'}
          </p>
          
          <div className="hero-ctas">
            <Link 
              to={hero?.cta_primary_link || '/register'} 
              className="cta-primary"
            >
              {hero?.cta_primary_label || 'Join as a Reviewer'}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 0L12.5 7.5L20 10L12.5 12.5L10 20L7.5 12.5L0 10L7.5 7.5L10 0Z"/>
              </svg>
            </Link>
            <Link 
              to={hero?.cta_secondary_link || '/login'} 
              className="cta-secondary"
            >
              {hero?.cta_secondary_label || 'Login to Dashboard'}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 10L12 10M12 10L9 7M12 10L9 13"/>
                <rect x="1" y="1" width="18" height="18" rx="3"/>
              </svg>
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <svg className="glyph-spinner" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="glyphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00B8D9"/>
                <stop offset="100%" stopColor="#0A192F"/>
              </linearGradient>
            </defs>
            <g className="glyph-group">
              <text x="50" y="80" fontSize="60" fill="url(#glyphGradient)" fontWeight="bold">AI</text>
              <text x="120" y="80" fontSize="40" fill="url(#glyphGradient)" opacity="0.7">Data</text>
              <text x="50" y="140" fontSize="50" fill="url(#glyphGradient)" opacity="0.8">OCR</text>
              <text x="110" y="140" fontSize="45" fill="url(#glyphGradient)" opacity="0.6">Voice</text>
            </g>
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#glyphGradient)" strokeWidth="2" opacity="0.3" className="orbit-ring"/>
          </svg>
        </div>
      </section>

      <section className="stats-banner">
        <div className="stat-item">
          <div className="stat-number">15+</div>
          <div className="stat-label">Indian Languages</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Data Items Reviewed</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">500+</div>
          <div className="stat-label">Active Reviewers</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">99%</div>
          <div className="stat-label">Quality Score</div>
        </div>
      </section>

      {testimonials && testimonials.length > 0 && (
        <section className="testimonials-section" id="testimonials">
          <h2 className="section-title">What Reviewers Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-icon">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  {testimonial.avatar_url && (
                    <img src={testimonial.avatar_url} alt={testimonial.name} className="author-avatar"/>
                  )}
                  {!testimonial.avatar_url && (
                    <div className="author-avatar-placeholder" aria-hidden="true">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sponsors && sponsors.length > 0 && (
        <section className="sponsors-section" id="sponsors">
          <h2 className="section-title">Our Sponsors</h2>
          <div className="sponsors-grid">
            {sponsors.map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="sponsor-card"
              >
                <img src={sponsor.logo_url} alt={sponsor.name} className="sponsor-logo"/>
                <span className="sponsor-name">{sponsor.name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <h3>
                <span className="brand-indic">Indic</span><span className="brand-glyph">Glyph</span>
                <span className="brand-studio"> Data Studio</span>
              </h3>
              <p className="footer-blurb">
                {footer?.blurb || 'IndicGlyph Data Studio empowers reviewers worldwide to shape the future of AI for multilingual content.'}
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Platform</h4>
                <Link to="/register">Join as Reviewer</Link>
                <Link to="/login">Login</Link>
                <Link to="/admin">Platform Console</Link>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <a href="#features">Features</a>
                <a href="#testimonials">Testimonials</a>
                <a href="#sponsors">Sponsors</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              (c) {new Date().getFullYear()} IndicGlyph Data Studio -- Powered by{' '}
              <a 
                href={footer?.company_url || 'https://www.taapset.com'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="taapset-link"
              >
                {footer?.company_name || 'Taapset Technologies Pvt Ltd'}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
