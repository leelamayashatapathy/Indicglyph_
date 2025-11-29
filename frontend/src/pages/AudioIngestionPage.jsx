import { useEffect, useMemo, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import ErrorBanner from '../components/ErrorBanner'
import { api } from '../services/api'
import '../styles/OcrIngestionPage.css'

export default function AudioIngestionPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [datasetTypes, setDatasetTypes] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState(null)
  const [sliceDialog, setSliceDialog] = useState(null)
  const [sliceLanguage, setSliceLanguage] = useState('en')
  const [sliceDatasetType, setSliceDatasetType] = useState('')
  const [sliceSubmitting, setSliceSubmitting] = useState(false)
  const [retryJob, setRetryJob] = useState(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    loadJobs()
    loadDatasetTypes()
  }, [])

  const filteredJobs = useMemo(() => {
    if (!statusFilter) return jobs
    return jobs.filter((job) => job.status === statusFilter)
  }, [jobs, statusFilter])

  async function loadJobs() {
    try {
      setLoading(true)
      const data = await api.getAudioJobs()
      setJobs(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadDatasetTypes() {
    try {
      const types = await api.getDatasetTypes()
      setDatasetTypes(types.filter(t => t.modality === 'voice' || t.modality === 'conversation'))
    } catch (err) {
      console.error('Failed to load dataset types:', err)
    }
  }

  async function handleFileUpload(file) {
    if (!file) return
    if (!validateFile(file)) return
    try {
      setUploading(true)
      setError(null)
      setFileError(null)
      await api.uploadForAudio(file)
      setSelectedFile(null)
      await loadJobs()
      setToast({ type: 'success', message: 'Audio uploaded and queued' })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function validateFile(file) {
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac']
    const extension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!allowedExtensions.includes(extension)) {
      setFileError('Invalid file type. Allowed: .mp3, .wav, .m4a, .ogg, .flac')
      return false
    }
    
    if (file.size > 50 * 1024 * 1024) {
      setFileError('File too large. Maximum: 50MB')
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

  async function handleTranscribe(jobId) {
    try {
      await api.transcribeAudioJob(jobId)
      await loadJobs()
      setToast({ type: 'success', message: 'Transcription started' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  function openSliceDialog(job) {
    if (!datasetTypes.length) {
      setToast({ type: 'error', message: 'No voice/conversation dataset types found' })
      return
    }
    setSliceDatasetType(datasetTypes[0]?._id || '')
    setSliceLanguage(datasetTypes[0]?.languages?.[0] || 'en')
    setSliceDialog(job)
  }

  async function handleSliceSubmit() {
    if (!sliceDialog || !sliceDatasetType) return
    setSliceSubmitting(true)
    try {
      await api.sliceAudioJob(sliceDialog.id, sliceDatasetType, sliceLanguage)
      setToast({ type: 'success', message: 'Audio sliced to dataset items' })
      setSliceDialog(null)
      await loadJobs()
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to slice audio' })
    } finally {
      setSliceSubmitting(false)
    }
  }

  async function handleRetry(jobId) {
    setRetryJob(null)
    try {
      await api.transcribeAudioJob(jobId)
      await loadJobs()
      setToast({ type: 'success', message: 'Retry triggered' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  function getStatusMeta(status) {
    const mapping = {
      completed: { label: 'Completed' },
      transcribing: { label: 'Transcribing', spinner: true },
      failed: { label: 'Failed' },
      waiting_for_manual_transcript: { label: 'Needs manual transcript' },
      pending: { label: 'Pending' }
    }
    return mapping[status] || { label: status }
  }

  return (
    <div className="ocr-ingestion-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <h1 className="page-title">Audio Transcription</h1>
          <p className="page-subtitle">Upload audio files for ASR transcription</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadJobs} />}

      <div className="upload-card card">
        <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".mp3,.wav,.m4a,.ogg,.flac"
            disabled={uploading}
            style={{ display: 'none' }}
          />
          
          {selectedFile ? (
            <div className="file-preview">
              <div className="file-info">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={(e) => { e.stopPropagation(); handleFileUpload(selectedFile); }}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          ) : (
            <div>
              <p>Click or drag audio file here</p>
              <p className="file-hint">Supported: .mp3, .wav, .m4a, .ogg, .flac (max 50MB)</p>
            </div>
          )}
        </div>
        {fileError && <p className="input-error-text" style={{ marginTop: '8px' }}>{fileError}</p>}
      </div>

      <div className="jobs-section">
        <div className="jobs-header">
          <h2>Audio Jobs</h2>
          <div className="jobs-controls">
            <div className="filter-group">
              <label className="filter-label" htmlFor="audio-status-filter">Status:</label>
              <select
                id="audio-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
                style={{ width: '180px' }}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="transcribing">Transcribing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <button onClick={loadJobs} className="btn btn-secondary btn-icon" title="Refresh">
              Refresh
            </button>
          </div>
        </div>

        {loading && <p>Loading jobs...</p>}
        {!loading && filteredJobs.length === 0 && (
          <div className="empty-state">
            <h3>No audio jobs yet</h3>
            <p>Upload a file to see it appear here.</p>
          </div>
        )}
        {!loading && filteredJobs.length > 0 && (
          <div className="jobs-table-wrapper" role="region" aria-label="Audio jobs table">
            <table className="jobs-table data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => {
                  const meta = getStatusMeta(job.status)
                  return (
                    <tr key={job.id}>
                      <td className="job-name-cell">
                        <div className="job-file-name">{job.original_filename}</div>
                        <div className="job-id-subtle">ID: {job.id}</div>
                      </td>
                      <td>
                        <div className="job-status-cell">
                          {meta.spinner && <span className="spinner inline-spinner" aria-hidden="true"></span>}
                          <StatusBadge status={job.status} />
                        </div>
                      </td>
                      <td>{job.duration ? `${job.duration.toFixed(1)}s` : 'N/A'}</td>
                      <td>{job.file_type}</td>
                      <td className="job-actions-cell">
                        {job.status === 'pending' && (
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleTranscribe(job.id)}
                          >
                            Transcribe
                          </button>
                        )}
                        {(job.status === 'completed' || job.status === 'waiting_for_manual_transcript') && (
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => openSliceDialog(job)}
                          >
                            Slice to Items
                          </button>
                        )}
                        {job.status === 'failed' && (
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setRetryJob(job)}
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sliceDialog && (
        <ConfirmDialog
          open={!!sliceDialog}
          title="Slice audio to items"
          description={`Select the dataset type for ${sliceDialog.original_filename}`}
          confirmLabel="Slice audio"
          onCancel={() => setSliceDialog(null)}
          onConfirm={handleSliceSubmit}
          loading={sliceSubmitting}
        >
          <div className="input-group">
            <label className="input-label" htmlFor="slice-type">Dataset type</label>
            <select
              id="slice-type"
              className="input"
              value={sliceDatasetType}
              onChange={(e) => {
                const next = e.target.value
                setSliceDatasetType(next)
                const languages = datasetTypes.find((dt) => dt._id === next)?.languages || []
                setSliceLanguage(languages[0] || 'en')
              }}
            >
              {datasetTypes.map((dt) => (
                <option key={dt._id} value={dt._id}>{dt.name} ({dt.modality})</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="slice-lang">Language</label>
            <select
              id="slice-lang"
              className="input"
              value={sliceLanguage}
              onChange={(e) => setSliceLanguage(e.target.value)}
            >
              {(datasetTypes.find((dt) => dt._id === sliceDatasetType)?.languages || ['en']).map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <p className="helper-text">The transcript will be converted to dataset items using the selected dataset type.</p>
        </ConfirmDialog>
      )}

      {retryJob && (
        <ConfirmDialog
          open={!!retryJob}
          title="Retry failed job?"
          description="Retrying will enqueue the audio again."
          confirmLabel="Retry job"
          onCancel={() => setRetryJob(null)}
          onConfirm={() => handleRetry(retryJob.id)}
        />
      )}
    </div>
  )
}
