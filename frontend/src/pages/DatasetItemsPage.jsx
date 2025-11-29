import { useEffect, useState } from 'react'
import { api } from '../services/api'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSkeleton from '../components/LoadingSkeleton'
import '../styles/DatasetItemsPage.css'

export default function DatasetItemsPage() {
  const [items, setItems] = useState([])
  const [datasetTypes, setDatasetTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, finalized: 0 })
  
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false
  })
  
  const [filters, setFilters] = useState({
    dataset_type_id: '',
    language: '',
    status: '',
    finalized: '',
    search: ''
  })

  const [sortConfig, setSortConfig] = useState({
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  useEffect(() => {
    loadDatasetTypes()
    loadItems()
  }, [])

  const loadDatasetTypes = async () => {
    try {
      const data = await api.getDatasetTypes()
      setDatasetTypes(data)
    } catch (err) {
      console.error('Failed to load dataset types:', err)
    }
  }

  const loadItems = async (offset = 0) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = {
        ...filters,
        ...sortConfig,
        limit: pagination.limit,
        offset
      }
      const data = await api.getDatasetItems(params)
      setItems(data.items || data)
      setPagination({
        total: data.total || data.length || 0,
        limit: data.limit || pagination.limit,
        offset: data.offset || 0,
        hasMore: data.has_more || false
      })
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError(err.message || 'Failed to load dataset items')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadItems()
  }

  const handleResetFilters = () => {
    setFilters({
      dataset_type_id: '',
      language: '',
      status: '',
      finalized: '',
      search: ''
    })
    setTimeout(() => loadItems(), 0)
  }

  const handleSort = (field) => {
    const newOrder = sortConfig.sort_by === field && sortConfig.sort_order === 'desc' ? 'asc' : 'desc'
    setSortConfig({ sort_by: field, sort_order: newOrder })
    setTimeout(() => loadItems(), 0)
  }

  const getDatasetTypeName = (typeId) => {
    const dt = datasetTypes.find(t => t._id === typeId)
    return dt ? dt.name : typeId
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'in_review': return 'status-in-review'
      case 'finalized': return 'status-finalized'
      default: return ''
    }
  }

  const getSortIcon = (field) => {
    if (sortConfig.sort_by !== field) return '<>'
    return sortConfig.sort_order === 'asc' ? '^' : 'v'
  }

  if (loading && items.length === 0) {
    return (
      <div className="page-container">
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Dataset Items</h1>
          <p>View and manage all dataset items in the system</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.total || pagination.total}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-value">{stats.pending || 0}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card finalized">
          <div className="stat-value">{stats.finalized || 0}</div>
          <div className="stat-label">Finalized</div>
        </div>
      </div>

      <div className="filters-section">
        <h3>Search & Filters</h3>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Search in item content..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
            className="search-input"
          />
        </div>

        <div className="filters-grid">
          <div className="form-group">
            <label>Dataset Type</label>
            <select
              value={filters.dataset_type_id}
              onChange={(e) => setFilters({ ...filters, dataset_type_id: e.target.value })}
            >
              <option value="">All Types</option>
              {datasetTypes.map(dt => (
                <option key={dt._id} value={dt._id}>{dt.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Language</label>
            <select
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>

          <div className="form-group">
            <label>Finalized</label>
            <select
              value={filters.finalized}
              onChange={(e) => setFilters({ ...filters, finalized: e.target.value })}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <div className="filters-actions">
          <button onClick={handleApplyFilters} className="btn btn-primary">
            Apply Filters
          </button>
          <button onClick={handleResetFilters} className="btn btn-secondary">
            Reset
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadItems} />}

      <div className="items-stats">
        <p>
          Showing <strong>{items.length}</strong> items 
          {pagination.total > 0 && ` (${pagination.offset + 1}-${Math.min(pagination.offset + items.length, pagination.total)} of ${pagination.total} total)`}
        </p>
      </div>
      
      {pagination.total > pagination.limit && (
        <div className="pagination-controls">
          <button
            onClick={() => loadItems(Math.max(0, pagination.offset - pagination.limit))}
            disabled={pagination.offset === 0 || loading}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={() => loadItems(pagination.offset + pagination.limit)}
            disabled={!pagination.hasMore || loading}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      <div className="items-table-container" role="region" aria-label="Dataset items table" tabIndex={0}>
        {items.length === 0 ? (
          <div className="empty-state">
            <p>No items found matching the current filters.</p>
          </div>
        ) : (
          <table className="items-table data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('item_number')} className="sortable">
                  # {getSortIcon('item_number')}
                </th>
                <th>Dataset Type</th>
                <th>Language</th>
                <th>Status</th>
                <th onClick={() => handleSort('review_count')} className="sortable">
                  Reviews {getSortIcon('review_count')}
                </th>
                <th>Skips</th>
                <th>Finalized</th>
                <th>Content Preview</th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  Created {getSortIcon('created_at')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id || Math.random()}>
                  <td>
                    <span className="item-number">
                      {item.item_number ? `#${item.item_number}` : 'N/A'}
                    </span>
                  </td>
                  <td>{getDatasetTypeName(item.dataset_type_id)}</td>
                  <td><span className="lang-badge">{item.language || 'N/A'}</span></td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(item.review_state?.status)}`}>
                      {item.review_state?.status || 'unknown'}
                    </span>
                  </td>
                  <td>{item.review_state?.review_count || 0}</td>
                  <td>{item.review_state?.skip_count || 0}</td>
                  <td>{item.review_state?.finalized ? 'Yes' : 'No'}</td>
                  <td className="content-preview">
                    {item.content && Object.entries(item.content).slice(0, 2).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {value ? String(value).substring(0, 50) : 'N/A'}
                        {value && String(value).length > 50 && '...'}
                      </div>
                    ))}
                  </td>
                  <td className="created-date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
