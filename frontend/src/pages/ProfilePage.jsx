import { useAuth } from '../hooks/useAuth'
import '../styles/ProfilePage.css'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="card profile-page">
      <h2>Profile</h2>
      <div className="profile-content">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</p>
        <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  )
}
