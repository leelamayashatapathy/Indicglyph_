import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { api } from '../services/api'
import '../styles/OcrJobDetailPage.css'

export default function OcrJobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [datasetTypes, setDatasetTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sliceModalOpen, setSliceModalOpen] = useState(false)
  const [sliceDatasetType, setSliceDatasetType] = useState('')
  const [sliceTargetField, setSliceTargetField] = useState('')
  const [sliceLanguage, setSliceLanguage] = useState('en')
  const [selectedPages, setSelectedPages] = useState([])
  const [sliceSubmitting, setSliceSubmitting] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    Promise.all([loadJob(), loadDatasetTypes()])
  }, [jobId])

  useEffect(() => {
    if (!sliceDatasetType) return
    const type = datasetTypes.find((dt) => dt._id === sliceDatasetType)
    if (!type) return
    const textField = (type.fields || []).find((f) => ['text', 'textarea'].includes(f.type)) || type.fields?.[0]
    setSliceTargetField(textField ? textField.key : '')
    setSliceLanguage(type.languages?.[0] || 'en')
  }, [sliceDatasetType, datasetTypes])

  const textFieldsForSelected = useMemo(() => {
    const type = datasetTypes.find((dt) => dt._id === sliceDatasetType)
    return type?.fields?.filter((f) => ['text', 'textarea'].includes(f.type)) || []
  }, [sliceDatasetType, datasetTypes])

  async function loadJob() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getOcrJob(jobId)
      setJob(data)
      setSelectedPages((data.results || []).map((res) => res.page_index))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadDatasetTypes() {
    try {
      const types = await api.getDatasetTypes()
      setDatasetTypes(types || [])
    } catch (err) {
      console.error('Failed to load dataset types:', err)
    }
  }

  async function handleRetry() {
    try {
      await api.retryOcrJob(jobId)
      await loadJob()
      setToast({ type: 'success', message: 'Job retried' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  async function handleCancel() {
    setCancelDialogOpen(false)
    try {
      await api.cancelOcrJob(jobId)
      await loadJob()
      setToast({ type: 'success', message: 'Job cancelled' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  async function handleSliceSubmit() {
    if (!job || !job.results || job.results.length === 0) return
    if (!sliceDatasetType || !sliceTargetField || selectedPages.length === 0) {
      setToast({ type: 'error', message: 'Select a dataset type, field, and at least one page' })
      return
    }

    const slices = job.results
      .filter((res) => selectedPages.includes(res.page_index))
      .map((res) => ({
        page_index: res.page_index,
        language: sliceLanguage,
        content: {
          [sliceTargetField]: res.full_text || '',
          page_number: res.page_index + 1
        }
      }))

    setSliceSubmitting(true)
    try {
      await api.sliceOcrJob(jobId, sliceDatasetType, slices)
      setSliceModalOpen(false)
      setToast({ type: 'success', message: `Created ${slices.length} dataset item(s)` })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create items' })
    } finally {
      setSliceSubmitting(false)
    }
  }

  function togglePageSelection(pageIndex) {
    setSelectedPages((prev) =>
      prev.includes(pageIndex)
        ? prev.filter((idx) => idx !== pageIndex)
        : [...prev, pageIndex]
    )
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  if (loading) return <div className="loading"><LoadingSkeleton lines={6} /></div>
  if (error) return <ErrorBanner message={error} onRetry={loadJob} />
  if (!job) return <div className="error-message">Job not found</div>

  return (
    <div className="ocr-job-detail-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="page-header">
        <button onClick={() => navigate('/admin/ocr')} className="btn-back">
          Back to Jobs
        </button>
        <h1>OCR Job Details</h1>
      </div>

      <div className="job-info-card card">
        <div className="info-row">
          <span className="info-label">Job ID:</span>
          <span className="info-value">{job.id}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Filename:</span>
          <span className="info-value">{job.original_filename}</span>
        </div>
        <div className="info-row">
          <span className="info-label">File Type:</span>
          <span className="info-value">{job.file_type.toUpperCase()}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Status:</span>
          <div className="info-value status-inline">
            {(job.status === 'processing' || job.status === 'pending') && <span className="spinner inline-spinner" aria-hidden="true"></span>}
            <StatusBadge status={job.status} />
          </div>
        </div>
        <div className="info-row">
          <span className="info-label">Total Pages:</span>
          <span className="info-value">{job.total_pages || 0}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Created:</span>
          <span className="info-value">{formatDate(job.created_at)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Completed:</span>
          <span className="info-value">{formatDate(job.completed_at)}</span>
        </div>
        {job.error_message && (
          <div className="info-row error-row">
            <span className="info-label">Error:</span>
            <span className="info-value error-text">{job.error_message}</span>
          </div>
        )}
      </div>

      <div className="job-actions">
        {job.status === 'failed' && (
          <button onClick={handleRetry} className="btn btn-primary">
            Retry Job
          </button>
        )}
        {job.status === 'pending' && (
          <button onClick={() => setCancelDialogOpen(true)} className="btn btn-danger">
            Cancel Job
          </button>
        )}
        {job.status === 'completed' && (
          <button onClick={() => setSliceModalOpen(true)} className="btn btn-primary">
            Slice to Dataset Items
          </button>
        )}
      </div>

      {job.results && job.results.length > 0 && (
        <div className="ocr-results">
          <h2>OCR Results ({job.results.length} pages)</h2>
          {job.results.map((result, idx) => (
            <div key={result.page_index} className="result-card card">
              <div className="result-header">
                <div className="result-header-left">
                  <h3>Page {result.page_index + 1}</h3>
                  <label className="page-select">
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(result.page_index)}
                      onChange={() => togglePageSelection(result.page_index)}
                    />
                    Include in slice
                  </label>
                </div>
                <span className="confidence-badge">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="result-text">
                {result.full_text || 'No text detected'}
              </div>
              {result.blocks && result.blocks.length > 0 && (
                <details className="result-blocks">
                  <summary>{result.blocks.length} text blocks detected</summary>
                  <div className="blocks-list">
                    {result.blocks.map((block, blockIdx) => (
                      <div key={blockIdx} className="block-item">
                        <span className="block-text">{block.text}</span>
                        <span className="block-confidence">
                          {(block.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {sliceModalOpen && (
        <ConfirmDialog
          open={sliceModalOpen}
          title="Create dataset items"
          description="Choose a dataset type and field for the OCR text. Only selected pages will be created."
          confirmLabel={`Create ${selectedPages.length || 0} item(s)`}
          confirmTone="primary"
          loading={sliceSubmitting}
          onCancel={() => setSliceModalOpen(false)}
          onConfirm={handleSliceSubmit}
        >
          <div className="summary-grid">
            <div className="summary-tile">
              <span className="summary-label">Pages selected</span>
              <span className="summary-value">{selectedPages.length}</span>
            </div>
            <div className="summary-tile">
              <span className="summary-label">Job pages</span>
              <span className="summary-value">{job.results?.length || 0}</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="slice-dataset-type">Dataset type</label>
            <select
              id="slice-dataset-type"
              className="input"
              value={sliceDatasetType}
              onChange={(e) => setSliceDatasetType(e.target.value)}
            >
              <option value="">Select dataset type</option>
              {datasetTypes.map((dt) => (
                <option key={dt._id} value={dt._id}>
                  {dt.name} ({dt.modality})
                </option>
              ))}
            </select>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label className="input-label" htmlFor="slice-language">Language</label>
              <select
                id="slice-language"
                className="input"
                value={sliceLanguage}
                onChange={(e) => setSliceLanguage(e.target.value)}
              >
                {(datasetTypes.find((dt) => dt._id === sliceDatasetType)?.languages || ['en']).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="slice-target-field">Map OCR text to field</label>
              <select
                id="slice-target-field"
                className="input"
                value={sliceTargetField}
                onChange={(e) => setSliceTargetField(e.target.value)}
                disabled={!sliceDatasetType}
              >
                <option value="">Select field</option>
                {textFieldsForSelected.map((field) => (
                  <option key={field.key} value={field.key}>{field.label} ({field.key})</option>
                ))}
              </select>
              {!textFieldsForSelected.length && sliceDatasetType && (
                <p className="helper-text">No text fields detected for this dataset type.</p>
              )}
            </div>
          </div>

          <p className="helper-text">
            Content will include page metadata automatically. Selected field will receive the full OCR text for each page.
          </p>
        </ConfirmDialog>
      )}

      {cancelDialogOpen && (
        <ConfirmDialog
          open={cancelDialogOpen}
          title="Cancel this job?"
          description="Cancelling a pending job cannot be undone."
          confirmLabel="Cancel job"
          confirmTone="danger"
          onCancel={() => setCancelDialogOpen(false)}
          onConfirm={handleCancel}
        />
      )}
    </div>
  )
}
