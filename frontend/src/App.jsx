import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import ThemeToggle from './components/ThemeToggle'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import ReviewPage from './pages/ReviewPage'
import ReviewerDashboardPage from './pages/ReviewerDashboardPage'
import AdminPanel from './pages/AdminPanel'
import AdminOverview from './pages/AdminOverview'
import DatasetTypesPage from './pages/DatasetTypesPage'
import AddDatasetItemsPage from './pages/AddDatasetItemsPage'
import DatasetItemsPage from './pages/DatasetItemsPage'
import UserManagementPage from './pages/UserManagementPage'
import SystemConfigPage from './pages/SystemConfigPage'
import PayoutManagementPage from './pages/PayoutManagementPage'
import OcrIngestionPage from './pages/OcrIngestionPage'
import OcrJobDetailPage from './pages/OcrJobDetailPage'
import AudioIngestionPage from './pages/AudioIngestionPage'
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'
import FlaggedItemsPage from './pages/FlaggedItemsPage'
import HomepageSetup from './pages/HomepageSetup'
import SessionMessage from './components/SessionMessage'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

function Navigation() {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  
  const isAdmin = user?.roles?.some(role => ['platform_operator', 'super_operator'].includes(role))
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const menuId = 'primary-nav-menu'

  return (
    <nav>
      <div className="nav-content">
        <h1 className="brand-logo">
          <span className="brand-indic">Indic</span><span className="brand-glyph">Glyph</span>
          <span className="brand-studio"> Data Studio</span>
        </h1>
        
        <ThemeToggle className="theme-toggle" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button 
            className="hamburger-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls={menuId}
          >
            <span className={mobileMenuOpen ? 'open' : ''}></span>
            <span className={mobileMenuOpen ? 'open' : ''}></span>
            <span className={mobileMenuOpen ? 'open' : ''}></span>
          </button>

          <ul id={menuId} className={mobileMenuOpen ? 'mobile-open' : ''}>
            {user ? (
              <>
                <li><Link to="/review" onClick={() => setMobileMenuOpen(false)}>Review</Link></li>
                <li><Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link></li>
                {isAdmin && <li><Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Platform Console</Link></li>}
                <li><Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile ({user.username})</Link></li>
                <li><button onClick={() => { logout(); setMobileMenuOpen(false); }} style={{ padding: '0.25rem 1rem' }}>Logout</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link></li>
                <li><Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        Copyright 2025 IndicGlyph - Powered by Taapset Technologies Pvt Ltd.
      </div>
    </footer>
  )
}

function AppContent() {
  const { user, authMessage, setAuthMessage } = useAuth()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  return (
    <>
      {user && <Navigation />}
      <div className="session-message-wrapper">
        <SessionMessage message={authMessage} onDismiss={() => setAuthMessage('')} />
      </div>
      <div className={user && !isAdminRoute ? "container" : ""}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ReviewerDashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/review" element={
            <ProtectedRoute>
              <ReviewPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="dataset-types" element={<DatasetTypesPage />} />
            <Route path="add-items" element={<AddDatasetItemsPage />} />
            <Route path="dataset-items" element={<DatasetItemsPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="system-config" element={<SystemConfigPage />} />
            <Route path="payouts" element={<PayoutManagementPage />} />
            <Route path="analytics" element={<AnalyticsDashboardPage />} />
            <Route path="flagged-items" element={<FlaggedItemsPage />} />
            <Route path="ocr" element={<OcrIngestionPage />} />
            <Route path="audio" element={<AudioIngestionPage />} />
            <Route path="homepage-setup" element={<HomepageSetup />} />
            <Route path="ocr/:jobId" element={<OcrJobDetailPage />} />
          </Route>
        </Routes>
      </div>
      {user && <Footer />}
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
