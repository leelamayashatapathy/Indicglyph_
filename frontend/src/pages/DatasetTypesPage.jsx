import { useEffect, useState } from 'react'
import { api } from '../services/api'
import '../styles/DatasetTypesPage.css'

export default function DatasetTypesPage() {
  const [datasetTypes, setDatasetTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    modality: 'text',
    fields: [{ key: '', type: 'text', label: '', required: false, review_widget: '' }],
    languages: ['en'],
    payout_rate: 0.003,
    review_guidelines: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [availableLanguages, setAvailableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
  ])

  useEffect(() => {
    loadDatasetTypes()
    loadSystemConfig()
  }, [])

  const loadDatasetTypes = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await api.getDatasetTypes()
      setDatasetTypes(data)
    } catch (err) {
      setError(err.message || 'Failed to load dataset types')
    } finally {
      setLoading(false)
    }
  }

  const loadSystemConfig = async () => {
    try {
      const config = await api.getSystemConfig()
      if (config.available_languages && config.available_languages.length > 0) {
        setAvailableLanguages(config.available_languages)
      }
    } catch (err) {
      console.error('Failed to load system config:', err)
      // Use fallback languages
    }
  }

  const handleAddField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { key: '', type: 'text', label: '', required: false, review_widget: '' }]
    })
  }

  const handleRemoveField = (index) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    })
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const handleFieldChange = (index, field, value) => {
    const updatedFields = [...formData.fields]
    updatedFields[index] = { ...updatedFields[index], [field]: value }
    setFormData({ ...formData, fields: updatedFields })
    setFieldErrors(prev => ({ ...prev, [index]: null }))
  }

  const handleLanguageChange = (lang, checked) => {
    let newLanguages
    if (checked) {
      newLanguages = [...formData.languages, lang]
    } else {
      newLanguages = formData.languages.filter(l => l !== lang)
    }
    setFormData({ ...formData, languages: newLanguages })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newFieldErrors = {}
    if (!formData.name.trim()) {
      setError('Dataset name is required')
      return
    }

    const keyCounts = formData.fields.reduce((acc, field) => {
      const key = field.key.trim()
      if (key) acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    formData.fields.forEach((field, index) => {
      const key = field.key.trim()
      if (!key) {
        newFieldErrors[index] = 'Key is required'
      } else if (keyCounts[key] > 1) {
        newFieldErrors[index] = 'Keys must be unique'
      }
      if (!field.label.trim()) {
        newFieldErrors[index] = newFieldErrors[index]
          ? `${newFieldErrors[index]} / Label is required`
          : 'Label is required'
      }
    })

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      setError('Please fix the highlighted field errors')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await api.createDatasetType(formData)
      await loadDatasetTypes()
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        modality: 'text',
        fields: [{ key: '', type: 'text', label: '', required: false, review_widget: '' }],
        languages: ['en'],
        payout_rate: 0.003,
        review_guidelines: '',
      })
      setFieldErrors({})
    } catch (err) {
      setError(err.message || 'Failed to create dataset type')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (id, currentActive) => {
    try {
      await api.updateDatasetType(id, { active: !currentActive })
      await loadDatasetTypes()
    } catch (err) {
      setError(err.message || 'Failed to update dataset type')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this dataset type? This will fail if items exist.')) {
      return
    }

    try {
      await api.deleteDatasetType(id)
      await loadDatasetTypes()
    } catch (err) {
      setError(err.message || 'Failed to delete dataset type')
    }
  }

  if (loading && !showCreateForm) {
    return <div className="loading">Loading dataset types...</div>
  }

  const modalityOptions = [
    { value: 'text', label: 'Text - Plain text review' },
    { value: 'ocr', label: 'OCR - Image with text extraction' },
    { value: 'voice', label: 'Voice - Audio transcription' },
    { value: 'conversation', label: 'Conversation - Multi-turn dialogue' },
    { value: 'image', label: 'Image - Visual content review' },
    { value: 'video', label: 'Video - Video content review' },
    { value: 'custom', label: 'Custom - Custom modality' },
  ]

  const reviewWidgetOptions = [
    { value: '', label: 'Auto (based on field type)' },
    { value: 'text_input', label: 'Text Input' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'image_viewer', label: 'Image Viewer' },
    { value: 'audio_player', label: 'Audio Player' },
    { value: 'video_player', label: 'Video Player' },
    { value: 'ocr_editor', label: 'OCR Editor' },
  ]

  const fieldTypes = [
    { value: 'text', label: 'Text (single line)' },
    { value: 'textarea', label: 'Textarea (multi-line)' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select (dropdown)' },
    { value: 'checkbox', label: 'Checkbox' },
  ]

  return (
    <div className="dataset-types-page">
      <div className="page-header">
        <h2>Dataset Types</h2>
        <button className="btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create Dataset Type'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="create-form-container">
          <h3>Create New Dataset Type</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., News Headlines"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this dataset type"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Modality *</label>
              <select
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                required
              >
                {modalityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <small className="help-text">The type of data being reviewed (affects UI rendering)</small>
            </div>

            <div className="form-group">
              <label>Payout Rate ($)</label>
              <input
                type="number"
                step="0.001"
                value={formData.payout_rate}
                onChange={(e) => setFormData({ ...formData, payout_rate: parseFloat(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Languages</label>
              <div className="checkbox-group">
                {availableLanguages.map(lang => (
                  <label key={lang.code} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang.code)}
                      onChange={(e) => handleLanguageChange(lang.code, e.target.checked)}
                    />
                    {lang.name} ({lang.code})
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Review Guidelines (Optional)</label>
              <textarea
                value={formData.review_guidelines}
                onChange={(e) => setFormData({ ...formData, review_guidelines: e.target.value })}
                placeholder="Instructions for reviewers on how to review this dataset type..."
                rows={4}
              />
              <small className="help-text">These guidelines will be shown to reviewers when they review items of this type.</small>
            </div>

            <div className="fields-section">
              <div className="fields-header">
                <label>Fields *</label>
                <button type="button" onClick={handleAddField} className="btn-secondary">
                  + Add Field
                </button>
              </div>

              {formData.fields.map((field, index) => (
                <div key={index} className="field-builder">
                  <div className="field-row">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                      placeholder="Field key (e.g., headline)"
                      required
                    />
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                      placeholder="Display label"
                      required
                    />
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                    >
                      {fieldTypes.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                    <select
                      value={field.review_widget || ''}
                      onChange={(e) => handleFieldChange(index, 'review_widget', e.target.value)}
                      title="Custom review widget"
                    >
                      {reviewWidgetOptions.map(rw => (
                        <option key={rw.value} value={rw.value}>{rw.label}</option>
                      ))}
                    </select>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    {formData.fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="btn-remove"
                      >
                        x
                      </button>
                    )}
                  </div>
                  {fieldErrors[index] && (
                    <div className="input-error-text">{fieldErrors[index]}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Dataset Type'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dataset-types-list">
        {datasetTypes.length === 0 ? (
          <div className="empty-state">
            <p>No dataset types created yet.</p>
            <p>Click "Create Dataset Type" to get started!</p>
          </div>
        ) : (
          datasetTypes.map(dt => (
            <div key={dt._id} className="dataset-type-card">
              <div className="dt-header">
                <div>
                  <h3>{dt.name}</h3>
                  {dt.description && <p className="dt-description">{dt.description}</p>}
                </div>
                <div className="dt-status">
                  <span className={`status-badge ${dt.active ? 'active' : 'inactive'}`}>
                    {dt.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="dt-details">
                <div className="dt-meta">
                  <span><strong>Payout:</strong> ${dt.payout_rate.toFixed(3)}</span>
                  <span><strong>Languages:</strong> {dt.languages.join(', ')}</span>
                  <span><strong>Fields:</strong> {dt.fields.length}</span>
                </div>

                <div className="dt-fields">
                  <strong>Schema:</strong>
                  <div className="fields-preview">
                    {dt.fields.map((field, i) => (
                      <span key={i} className="field-tag">
                        {field.label} ({field.type})
                        {field.required && <sup>*</sup>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dt-actions">
                <button
                  onClick={() => handleToggleActive(dt._id, dt.active)}
                  className="btn-secondary"
                >
                  {dt.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(dt._id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
