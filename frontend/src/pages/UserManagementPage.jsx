import { useState, useEffect } from 'react'
import { api } from '../services/api'
import '../styles/UserManagementPage.css'

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await api.getAllUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = async (username, currentRoles, role) => {
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]
    
    try {
      await api.updateUser(username, { roles: newRoles })
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to update user roles')
    }
  }

  const handleToggleActive = async (username, isActive) => {
    try {
      await api.updateUser(username, { is_active: !isActive })
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to update user status')
    }
  }

  const handleDelete = async (username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return
    }

    try {
      await api.deleteUser(username)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to delete user')
    }
  }

  if (loading) {
    return <div className="loading">Loading users...</div>
  }

  const availableRoles = ['user', 'reviewer', 'curator', 'platform_operator', 'super_operator', 'uploader', 'engineer']

  return (
    <div className="user-management-page">
      <h2>User Management</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Balance</th>
              <th>Reviews</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td><strong>{user.username}</strong></td>
                <td>{user.email}</td>
                <td>
                  <div className="roles-cell">
                    {editingUser === user.username ? (
                      <div className="roles-editor">
                        {availableRoles.map(role => (
                          <label key={role} className="role-checkbox">
                            <input
                              type="checkbox"
                              checked={user.roles?.includes(role)}
                              onChange={() => handleRoleToggle(user.username, user.roles || [], role)}
                            />
                            {role}
                          </label>
                        ))}
                        <button
                          className="btn-done"
                          onClick={() => setEditingUser(null)}
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <>
                        {user.roles?.join(', ') || 'user'}
                        <button
                          className="btn-edit-roles"
                          onClick={() => setEditingUser(user.username)}
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td>${user.payout_balance?.toFixed(3) || '0.000'}</td>
                <td>{user.reviews_done || 0}</td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleToggleActive(user.username, user.is_active)}
                      className="btn-secondary"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.username)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
