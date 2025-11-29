import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function AddDatasetItemsPage() {
  const [activeTab, setActiveTab] = useState('manual')
  const [datasetTypes, setDatasetTypes] = useState([])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // Manual entry state
  const [formData, setFormData] = useState({})

  // Bulk upload state
  const [zipFile, setZipFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  useEffect(() => {
    fetchDatasetTypes()
  }, [])

  const fetchDatasetTypes = async () => {
    try {
      const types = await api.getDatasetTypes()
      setDatasetTypes(types)
    } catch (err) {
      setError('Failed to load dataset types')
    }
  }

  useEffect(() => {
    if (selectedTypeId) {
      const type = datasetTypes.find(t => t._id === selectedTypeId)
      setSelectedType(type)
      
      // Initialize form data with empty values
      if (type) {
        const initialData = {}
        type.fields.forEach(field => {
          initialData[field.key] = ''
        })
        setFormData(initialData)
        setFieldErrors({})
      }
    } else {
      setSelectedType(null)
      setFormData({})
      setFieldErrors({})
    }
  }, [selectedTypeId, datasetTypes])

  const handleFieldChange = (fieldKey, value) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }))
    setFieldErrors(prev => ({ ...prev, [fieldKey]: null }))
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    const newFieldErrors = {}

    if (!selectedTypeId) {
      setLoading(false)
      setError('Please select a dataset type')
      return
    }

    try {
      // Validate required fields
      if (selectedType) {
        for (const field of selectedType.fields) {
          if (field.required && !formData[field.key]) {
            newFieldErrors[field.key] = `${field.label} is required`
          }
        }
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors)
        throw new Error('Please fix required fields')
      }

      await api.createDatasetItem({
        dataset_type_id: selectedTypeId,
        language: language,
        content: formData
      })

      setSuccess('Item created successfully!')
      
      // Reset form
      const initialData = {}
      selectedType.fields.forEach(field => {
        initialData[field.key] = ''
      })
      setFormData(initialData)
      setFieldErrors({})

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  const handleZipUpload = async (e) => {
    e.preventDefault()
    
    if (!zipFile) {
      setError('Please select a ZIP file')
      return
    }

    if (!selectedTypeId) {
      setError('Please select a dataset type')
      return
    }

    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      const result = await api.bulkUploadZip(selectedTypeId, language, zipFile)
      setUploadResult(result)
      setZipFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('zip-file-input')
      if (fileInput) fileInput.value = ''
    } catch (err) {
      setError(err.message || 'Failed to upload ZIP file')
    } finally {
      setUploading(false)
    }
  }

  const renderFieldWidget = (field) => {
    const value = formData[field.key] || ''

    if (field.review_widget === 'text_input' || field.type === 'text') {
      return (
        <input
          type="text"
          className="input"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.label}
          required={field.required}
        />
      )
    } else if (field.review_widget === 'textarea' || field.type === 'textarea') {
      return (
        <textarea
          className="input"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.label}
          rows={4}
          required={field.required}
        />
      )
    } else if (field.review_widget === 'image_viewer') {
      return (
        <div>
          {value && (
            <img 
              src={value} 
              alt={field.label}
              style={{ maxWidth: '200px', height: 'auto', borderRadius: '8px', marginBottom: '8px' }}
            />
          )}
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder="Image URL"
            required={field.required}
          />
        </div>
      )
    } else if (field.review_widget === 'audio_player') {
      return (
        <div>
          {value && (
            <audio 
              controls 
              src={value}
              style={{ width: '100%', maxWidth: '400px', marginBottom: '8px' }}
            >
              Your browser does not support the audio tag.
            </audio>
          )}
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder="Audio URL"
            required={field.required}
          />
        </div>
      )
    } else if (field.review_widget === 'video_player') {
      return (
        <div>
          {value && (
            <video 
              controls 
              src={value}
              style={{ maxWidth: '300px', height: 'auto', borderRadius: '8px', marginBottom: '8px' }}
            >
              Your browser does not support the video tag.
            </video>
          )}
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder="Video URL"
            required={field.required}
          />
        </div>
      )
    } else if (field.type === 'number') {
      return (
        <input
          type="number"
          className="input"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.label}
          step="0.01"
          required={field.required}
        />
      )
    } else {
      // Default: textarea
      return (
        <textarea
          className="input"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.label}
          rows={3}
          required={field.required}
        />
      )
    }
  }

  return (
    <div className="add-items-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Dataset Items</h1>
          <p className="page-subtitle">Create items manually or upload in bulk via ZIP</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          {success}
        </div>
      )}

      {/* Dataset Type & Language Selection */}
      <div className="selection-section glass-panel">
        <div className="form-row">
          <div className="form-group">
            <label>Dataset Type *</label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="select"
              required
            >
              <option value="">Select a dataset type...</option>
              {datasetTypes.map(type => (
                <option key={type._id} value={type._id}>
                  {type.name} ({type.modality})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Language *</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="select"
            >
              <option value="en">English (en)</option>
              <option value="hi">Hindi (hi)</option>
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
              <option value="zh">Chinese (zh)</option>
              <option value="ar">Arabic (ar)</option>
            </select>
          </div>
        </div>

        {selectedType && (
          <div className="type-info">
            <p><strong>Schema:</strong> {selectedType.fields.length} fields</p>
            {selectedType.description && <p>{selectedType.description}</p>}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      {selectedTypeId && (
        <>
          <div className="tab-switcher">
            <button
              className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/>
              </svg>
              Manual Entry
            </button>
            <button
              className={`tab-button ${activeTab === 'bulk' ? 'active' : ''}`}
              onClick={() => setActiveTab('bulk')}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"/>
              </svg>
              Bulk Upload (ZIP)
            </button>
          </div>

          {/* Manual Entry Tab */}
          {activeTab === 'manual' && selectedType && (
            <form onSubmit={handleManualSubmit} className="manual-form glass-panel">
              <h3 className="section-title">Item Content</h3>
              
              {selectedType.fields.map(field => (
                <div key={field.key} className="form-group">
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  {renderFieldWidget(field)}
                  {field.type && (
                    <small className="help-text">Type: {field.type}</small>
                  )}
                  {fieldErrors[field.key] && (
                    <div className="input-error-text">{fieldErrors[field.key]}</div>
                  )}
                </div>
              ))}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading || !selectedTypeId}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                      </svg>
                      Add Item
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Bulk Upload Tab */}
          {activeTab === 'bulk' && (
            <div className="bulk-upload-section glass-panel">
              <h3 className="section-title">ZIP File Upload</h3>
              <p className="help-text">
                Upload a ZIP file containing CSV or JSONL files. Each file will be parsed and items will be created automatically.
              </p>

              <div className="upload-instructions">
                <h4>Format Guidelines:</h4>
                <ul>
                  <li><strong>CSV files:</strong> First row should contain column headers matching field keys from the schema</li>
                  <li><strong>JSONL files:</strong> One JSON object per line, with keys matching the schema field keys</li>
                  <li>All items will use the selected language: <strong>{language}</strong></li>
                  <li>Maximum file size: 50MB</li>
                </ul>
              </div>

              <form onSubmit={handleZipUpload} className="upload-form">
                <div className="upload-zone">
                  <label htmlFor="zip-file-input" className="file-label">
                    <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"/>
                    </svg>
                    <span>{zipFile ? zipFile.name : 'Choose ZIP file or drag here'}</span>
                  </label>
                  <input
                    id="zip-file-input"
                    type="file"
                    accept=".zip"
                    onChange={(e) => setZipFile(e.target.files[0])}
                    className="file-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !zipFile || !selectedTypeId}
                  className="btn btn-primary"
                >
                  {uploading ? (
                    <>
                      <div className="spinner"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
                      </svg>
                      Upload & Process
                    </>
                  )}
                </button>
              </form>

              {uploadResult && (
                <div className="upload-result">
                  <h4>Upload Complete</h4>
                  <div className="result-stats">
                    <div className="stat-card success">
                      <div className="stat-value">{uploadResult.created_count}</div>
                      <div className="stat-label">Items Created</div>
                    </div>
                    {uploadResult.error_count > 0 && (
                      <div className="stat-card error">
                        <div className="stat-value">{uploadResult.error_count}</div>
                        <div className="stat-label">Errors</div>
                      </div>
                    )}
                  </div>

                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="error-list">
                      <h5>Errors:</h5>
                      {uploadResult.errors.map((err, idx) => (
                        <div key={idx} className="error-item">
                          <strong>{err.file}</strong>
                          {err.row && ` (row ${err.row})`}
                          {err.line && ` (line ${err.line})`}
                          : {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!selectedTypeId && (
        <div className="empty-state">
          <div className="empty-state-icon">[ ]</div>
          <h3>Select a Dataset Type</h3>
          <p>Choose a dataset type above to start adding items</p>
        </div>
      )}

    </div>
  )
}




