import { useState, useEffect } from 'react'
import { api } from '../services/api'
import '../styles/SystemConfigPage.css'

export default function SystemConfigPage() {
  const [config, setConfig] = useState({
    payout_rate_default: 0.002,
    skip_threshold_default: 5,
    lock_timeout_sec: 180,
    finalize_review_count: 3,
    gold_skip_correct_threshold: 5,
    max_unchecked_skips_before_prompt: 2,
    available_languages: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [newLangCode, setNewLangCode] = useState('')
  const [newLangName, setNewLangName] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await api.getSystemConfig()
      setConfig(data)
    } catch (err) {
      setError(err.message || 'Failed to load system config')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    const fieldErrors = {}

    if (config.payout_rate_default < 0) fieldErrors.payout_rate_default = 'Must be 0 or greater'
    if (config.finalize_review_count < 1 || config.finalize_review_count > 10) fieldErrors.finalize_review_count = 'Must be between 1 and 10'
    if (config.skip_threshold_default < 1 || config.skip_threshold_default > 20) fieldErrors.skip_threshold_default = 'Must be between 1 and 20'
    if (config.gold_skip_correct_threshold < 1 || config.gold_skip_correct_threshold > 20) fieldErrors.gold_skip_correct_threshold = 'Must be between 1 and 20'
    if (config.max_unchecked_skips_before_prompt < 1 || config.max_unchecked_skips_before_prompt > 10) fieldErrors.max_unchecked_skips_before_prompt = 'Must be between 1 and 10'
    if (config.lock_timeout_sec < 30 || config.lock_timeout_sec > 600) fieldErrors.lock_timeout_sec = 'Must be between 30 and 600'

    if (Object.keys(fieldErrors).length > 0) {
      setValidationErrors(fieldErrors)
      setError('Please fix validation errors before saving')
      setSubmitting(false)
      return
    }
    setValidationErrors({})

    try {
      await api.updateSystemConfig(config)
      setSuccess('System configuration updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update system config')
    } finally {
      setSubmitting(false)
    }
  }

  const addLanguage = () => {
    if (!newLangCode || !newLangName) {
      setError('Please enter both language code and name')
      return
    }

    // Check for duplicates
    const exists = config.available_languages.some(
      lang => lang.code.toLowerCase() === newLangCode.toLowerCase()
    )
    
    if (exists) {
      setError(`Language code "${newLangCode}" already exists`)
      return
    }

    setConfig({
      ...config,
      available_languages: [
        ...config.available_languages,
        { code: newLangCode, name: newLangName }
      ]
    })

    setNewLangCode('')
    setNewLangName('')
    setError(null)
  }

  const removeLanguage = (code) => {
    setConfig({
      ...config,
      available_languages: config.available_languages.filter(lang => lang.code !== code)
    })
  }

  if (loading) {
    return <div className="loading">Loading system config...</div>
  }

  return (
    <div className="system-config-page">
      <div className="page-header">
        <div>
          <h2>System Configuration</h2>
          <p className="subtitle">Configure platform-wide settings for payouts, reviews, queue management, and languages</p>
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

      <form onSubmit={handleSubmit}>
        <div className="config-grid">
          
          {/* Payout Settings Card */}
          <div className="config-card">
            <div className="card-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <h3>Payout Settings</h3>
            </div>
            
            <div className="form-group">
              <label>
                Default Payout Rate ($)
                <span className="help-text">Amount paid per review approval/edit</span>
              </label>
              <input
                type="number"
                step="0.001"
                value={config.payout_rate_default}
                onChange={(e) => setConfig({ ...config, payout_rate_default: parseFloat(e.target.value) })}
                min="0"
                required
              />
              {validationErrors.payout_rate_default && (
                <div className="input-error-text">{validationErrors.payout_rate_default}</div>
              )}
            </div>
          </div>

          {/* Review Settings Card */}
          <div className="config-card">
            <div className="card-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <h3>Review Settings</h3>
            </div>
            
            <div className="form-group">
              <label>
                Reviews for Finalization
                <span className="help-text">Number of approvals needed to finalize an item</span>
              </label>
              <input
                type="number"
                value={config.finalize_review_count}
                onChange={(e) => setConfig({ ...config, finalize_review_count: parseInt(e.target.value) })}
                min="1"
                max="10"
                required
              />
              {validationErrors.finalize_review_count && (
                <div className="input-error-text">{validationErrors.finalize_review_count}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                Skip Threshold
                <span className="help-text">Number of skips before an item is finalized</span>
              </label>
              <input
                type="number"
                value={config.skip_threshold_default}
                onChange={(e) => setConfig({ ...config, skip_threshold_default: parseInt(e.target.value) })}
                min="1"
                max="20"
                required
              />
              {validationErrors.skip_threshold_default && (
                <div className="input-error-text">{validationErrors.skip_threshold_default}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                Gold Skip Correct Threshold
                <span className="help-text">Number of "data is correct" skips for auto-finalization</span>
              </label>
              <input
                type="number"
                value={config.gold_skip_correct_threshold}
                onChange={(e) => setConfig({ ...config, gold_skip_correct_threshold: parseInt(e.target.value) })}
                min="1"
                max="20"
                required
              />
              {validationErrors.gold_skip_correct_threshold && (
                <div className="input-error-text">{validationErrors.gold_skip_correct_threshold}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                Max Unchecked Skips Before Prompt
                <span className="help-text">Skips before asking reviewer for reason</span>
              </label>
              <input
                type="number"
                value={config.max_unchecked_skips_before_prompt}
                onChange={(e) => setConfig({ ...config, max_unchecked_skips_before_prompt: parseInt(e.target.value) })}
                min="1"
                max="10"
                required
              />
              {validationErrors.max_unchecked_skips_before_prompt && (
                <div className="input-error-text">{validationErrors.max_unchecked_skips_before_prompt}</div>
              )}
            </div>
          </div>

          {/* Queue Settings Card */}
          <div className="config-card">
            <div className="card-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3>Queue Settings</h3>
            </div>
            
            <div className="form-group">
              <label>
                Item Lock Timeout (seconds)
                <span className="help-text">How long an item stays locked when fetched for review</span>
              </label>
              <input
                type="number"
                value={config.lock_timeout_sec}
                onChange={(e) => setConfig({ ...config, lock_timeout_sec: parseInt(e.target.value) })}
                min="30"
                max="600"
                required
              />
              {validationErrors.lock_timeout_sec && (
                <div className="input-error-text">{validationErrors.lock_timeout_sec}</div>
              )}
            </div>
          </div>

          {/* Languages Management Card */}
          <div className="config-card languages-card">
            <div className="card-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
              </svg>
              <h3>Available Languages</h3>
            </div>

            <div className="language-add-section">
              <div className="language-inputs">
                <input
                  type="text"
                  placeholder="Code (e.g., en)"
                  value={newLangCode}
                  onChange={(e) => setNewLangCode(e.target.value)}
                  maxLength={5}
                />
                <input
                  type="text"
                  placeholder="Name (e.g., English)"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addLanguage}
                  className="btn-add-language"
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="languages-list">
              {config.available_languages.map((lang) => (
                <div key={lang.code} className="language-item">
                  <div className="lang-info">
                    <span className="lang-code">{lang.code}</span>
                    <span className="lang-name">{lang.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang.code)}
                    className="btn-remove"
                    title="Remove language"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              ))}
              {config.available_languages.length === 0 && (
                <div className="empty-state">
                  <p>No languages configured yet. Add one above.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-save">
            {submitting ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Save Configuration
              </>
            )}
          </button>
          <button
            type="button"
            onClick={loadConfig}
            className="btn-reset"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Reset
          </button>
        </div>
      </form>

    </div>
  )
}

