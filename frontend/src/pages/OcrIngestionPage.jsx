import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import ErrorBanner from '../components/ErrorBanner'
import { api } from '../services/api'
import '../styles/OcrIngestionPage.css'

export default function OcrIngestionPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [jobToCancel, setJobToCancel] = useState(null)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadJobs()
  }, [statusFilter])

  async function loadJobs() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getOcrJobs(statusFilter || null)
      setJobs(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = useMemo(() => {
    if (!statusFilter) return jobs
    return jobs.filter((job) => job.status === statusFilter)
  }, [jobs, statusFilter])

  async function handleFileUpload(file) {
    if (!file) return
    if (!validateFile(file)) return

    try {
      setUploading(true)
      setError(null)
      setFileError(null)
      const job = await api.uploadForOcr(file)
      setSelectedFile(null)
      await loadJobs()
      setToast({ type: 'success', message: `Upload queued: ${job.original_filename || file.name}` })
      navigate(`/admin/ocr/${job.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function validateFile(file) {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'image/bmp']
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp']
    const extension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      setFileError('Invalid file type. Please upload PDF or image files (PDF, PNG, JPG, TIFF, BMP).')
      return false
    }
    
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setFileError('File too large. Maximum size is 10MB.')
      return false
    }
    
    return true
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
      setError(null)
      setFileError(null)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
      setError(null)
      setFileError(null)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'Not yet'
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="ocr-ingestion-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <h1 className="page-title">OCR Ingestion</h1>
          <p className="page-subtitle">Upload and process documents with optical character recognition</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadJobs} />}

      <div className="upload-card card animate-fade-in">
        <div 
          className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${selectedFile ? 'dropzone-has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.bmp"
            disabled={uploading}
            style={{ display: 'none' }}
          />
          
          {selectedFile ? (
            <div className="file-preview">
              <div className="file-icon">
                {selectedFile.type.includes('pdf') ? (
                  <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <div className="file-info">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                }}
                className="btn btn-ghost btn-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <div className="dropzone-icon">
                <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
                  <path d="M9 13h2v5a1 1 0 11-2 0v-5z"/>
                </svg>
              </div>
              <h3 className="dropzone-title">Drop your file here, or click to browse</h3>
              <p className="dropzone-hint">PDF, PNG, JPG, TIFF, BMP up to 10MB</p>
            </>
          )}
        </div>
        {fileError && <p className="input-error-text" style={{ marginTop: '8px' }}>{fileError}</p>}

        {selectedFile && (
          <div className="upload-actions">
            <button 
              onClick={() => handleFileUpload(selectedFile)}
              disabled={uploading}
              className="btn btn-primary btn-lg"
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                  </svg>
                  Upload & Process
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="jobs-section">
        <div className="jobs-header">
          <h2 className="section-title">Processing Jobs</h2>
          <div className="jobs-controls">
            <div className="filter-group">
              <label className="filter-label" htmlFor="ocr-status-filter">Status:</label>
              <select
                id="ocr-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
                style={{ width: '160px' }}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={loadJobs} className="btn btn-secondary btn-icon" title="Refresh">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">[ ]</div>
            <h3 className="empty-state-title">No Jobs Found</h3>
            <p className="empty-state-description">
              {statusFilter ? `No jobs with status "${statusFilter}"` : 'Upload a file to get started'}
            </p>
          </div>
        ) : (
          <div className="jobs-table-wrapper" role="region" aria-label="OCR jobs table">
            <table className="jobs-table data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Pages</th>
                  <th>File Type</th>
                  <th>Created</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="job-name-cell">
                      <div className="job-file-name">{job.original_filename}</div>
                      <div className="job-id-subtle">ID: {job.id}</div>
                    </td>
                    <td>
                      <div className="job-status-cell">
                        {(job.status === 'processing' || job.status === 'pending') && <span className="spinner inline-spinner" aria-hidden="true"></span>}
                        <StatusBadge status={job.status} />
                      </div>
                    </td>
                    <td>{job.total_pages || 0}</td>
                    <td>{job.file_type?.toUpperCase?.() || '-'}</td>
                    <td>{formatDate(job.created_at)}</td>
                    <td>{formatDate(job.completed_at)}</td>
                    <td className="job-actions-cell">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/admin/ocr/${job.id}`)}
                      >
                        Open
                      </button>
                      {job.status === 'pending' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setJobToCancel(job)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {jobToCancel && (
        <ConfirmDialog
          open={!!jobToCancel}
          title="Cancel OCR job"
          description="Cancelling a pending job will stop processing and cannot be undone."
          confirmLabel="Cancel job"
          confirmTone="danger"
          onCancel={() => setJobToCancel(null)}
          onConfirm={async () => {
            try {
              await api.cancelOcrJob(jobToCancel.id)
              setToast({ type: 'success', message: 'Job cancelled' })
              await loadJobs()
            } catch (err) {
              setToast({ type: 'error', message: err.message || 'Failed to cancel job' })
            } finally {
              setJobToCancel(null)
            }
          }}
        />
      )}
    </div>
  )
}
