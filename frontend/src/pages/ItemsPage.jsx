import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import '../styles/ItemsPage.css'

export default function ItemsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  })

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const data = await api.getItems()
      setItems(data)
    } catch (err) {
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.createItem({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
      })
      setFormData({ name: '', description: '', price: '' })
      setShowForm(false)
      await loadItems()
    } catch (err) {
      setError(err.message || 'Failed to create item')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return

    try {
      await api.deleteItem(id)
      await loadItems()
    } catch (err) {
      setError(err.message || 'Failed to delete item')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="items-page">
      <div className="page-header">
        <h2>Items</h2>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Item'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card item-form">
          <h3>Create New Item</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                className="input"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card">
          <p>No items yet. {user ? 'Create one above!' : 'Login to create items.'}</p>
        </div>
      ) : (
        <div className="items-list">
          {items.map((item) => (
            <div key={item.item_id} className="card item-card">
              <h3>{item.name}</h3>
              {item.description && <p>{item.description}</p>}
              <div className="price">${item.price.toFixed(2)}</div>
              <p className="text-muted">
                By {item.created_by}
              </p>
              {user && (user.role === 'platform_operator' || user.role === 'super_operator') && (
                <div className="actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.item_id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
