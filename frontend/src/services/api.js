const API_BASE = '/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new ApiError(error.detail || 'Request failed', response.status)
  }
  
  if (response.status === 204) {
    return null
  }
  
  return response.json()
}

export const api = {
  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    })
    localStorage.setItem('token', data.access_token)
    return data
  },

  async register(userData) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    })
    localStorage.setItem('token', data.access_token)
    return data
  },

  async getProfile() {
    return request('/auth/me')
  },

  logout() {
    localStorage.removeItem('token')
  },

  async getAssignedDatasets() {
    return request('/dashboard/assigned-datasets')
  },

  async getNextItem(languages = ['en']) {
    const langs = languages.join(',')
    return request(`/datasets/next?langs=${langs}`)
  },

  async getDatasetTypeSchema(datasetTypeId) {
    return request(`/datasets/type/${datasetTypeId}`)
  },

  async submitReview(itemId, action, changes = null, skipDataCorrect = false, skipFeedback = null) {
    return request('/review/submit', {
      method: 'POST',
      body: JSON.stringify({ 
        item_id: itemId, 
        action,
        changes,
        skip_data_correct: skipDataCorrect,
        skip_feedback: skipFeedback
      }),
    })
  },

  async flagItem(itemId, reason, note = null) {
    return request('/review/flag', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        reason,
        note
      }),
    })
  },

  async getReviewStats() {
    return request('/review/stats')
  },

  async getMyReviews() {
    return request('/review/my-reviews')
  },

  // Analytics endpoints
  async getReviewerStats() {
    return request('/operator/analytics/reviewers')
  },

  async getDatasetAnalytics(datasetTypeId = null) {
    const query = datasetTypeId ? `?dataset_type_id=${datasetTypeId}` : ''
    return request(`/operator/analytics/datasets${query}`)
  },

  async getFlaggedItems(filters = {}) {
    const params = new URLSearchParams()
    if (filters.dataset_type_id) params.append('dataset_type_id', filters.dataset_type_id)
    if (filters.language) params.append('language', filters.language)
    if (filters.reason) params.append('reason', filters.reason)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset !== undefined) params.append('offset', filters.offset)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/operator/analytics/flagged-items${query}`)
  },

  async getDatasetStats(languages = null) {
    const query = languages ? `?langs=${languages.join(',')}` : ''
    return request(`/datasets/stats${query}`)
  },

  async getAllUsers() {
    return request('/operator/users')
  },

  async updateUser(username, userData) {
    return request(`/operator/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },

  async deleteUser(username) {
    return request(`/operator/users/${username}`, {
      method: 'DELETE',
    })
  },

  async getAdminStats() {
    return request('/operator/stats')
  },

  async getSystemConfig() {
    return request('/operator/system-config')
  },

  async updateSystemConfig(config) {
    return request('/operator/system-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    })
  },

  async createDatasetType(datasetType) {
    return request('/operator/dataset-type', {
      method: 'POST',
      body: JSON.stringify(datasetType),
    })
  },

  async getDatasetTypes() {
    return request('/operator/dataset-type')
  },

  async getDatasetType(id) {
    return request(`/operator/dataset-type/${id}`)
  },

  async updateDatasetType(id, updates) {
    return request(`/operator/dataset-type/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  async deleteDatasetType(id) {
    return request(`/operator/dataset-type/${id}`, {
      method: 'DELETE',
    })
  },

  async getPayouts(status = null) {
    const query = status ? `?status=${status}` : ''
    return request(`/operator/payouts${query}`)
  },

  async processPayout(payoutId, status, notes = null) {
    return request(`/operator/payouts/${payoutId}/process`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    })
  },

  async getDatasetItems(filters = {}) {
    const params = new URLSearchParams()
    if (filters.dataset_type_id) params.append('dataset_type_id', filters.dataset_type_id)
    if (filters.language) params.append('language', filters.language)
    if (filters.status) params.append('status', filters.status)
    if (filters.finalized !== '' && filters.finalized !== null && filters.finalized !== undefined) {
      params.append('finalized', filters.finalized)
    }
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset !== undefined) params.append('offset', filters.offset)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/operator/dataset-items${query}`)
  },

  async changePassword(currentPassword, newPassword) {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ 
        current_password: currentPassword, 
        new_password: newPassword 
      }),
    })
  },

  async requestPayout(amount, paymentMethod = 'bank_transfer', paymentDetails = null) {
    return request('/users/request-payout', {
      method: 'POST',
      body: JSON.stringify({ 
        amount, 
        payment_method: paymentMethod,
        payment_details: paymentDetails
      }),
    })
  },

  async uploadForOcr(file) {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE}/operator/ocr/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new ApiError(error.detail || 'Upload failed', response.status)
    }
    
    return response.json()
  },

  async getOcrJobs(statusFilter = null) {
    const query = statusFilter ? `?status_filter=${statusFilter}` : ''
    return request(`/operator/ocr/jobs${query}`)
  },

  async getOcrJob(jobId) {
    return request(`/operator/ocr/jobs/${jobId}`)
  },

  async sliceOcrJob(jobId, datasetTypeId, mappings) {
    return request(`/operator/ocr/jobs/${jobId}/slice`, {
      method: 'POST',
      body: JSON.stringify({ 
        dataset_type_id: datasetTypeId,
        slices: mappings
      }),
    })
  },

  async retryOcrJob(jobId) {
    return request(`/operator/ocr/jobs/${jobId}/retry`, {
      method: 'POST',
    })
  },

  async cancelOcrJob(jobId) {
    return request(`/operator/ocr/jobs/${jobId}/cancel`, {
      method: 'POST',
    })
  },

  async bulkUploadDatasetItems(datasetTypeId, items) {
    return request('/operator/ocr/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ 
        dataset_type_id: datasetTypeId,
        items
      }),
    })
  },

  async exportDatasetItems(format, filters = {}) {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${API_BASE}/operator/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        format,
        filters
      }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Export failed' }))
      throw new ApiError(error.detail || 'Export failed', response.status)
    }
    
    // Get the filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition')
    const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/)
    const filename = filenameMatch ? filenameMatch[1] : `export_${Date.now()}.${format}`
    
    // Get the blob
    const blob = await response.blob()
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    return { success: true, filename }
  },

  // Audio transcription endpoints
  async uploadForAudio(file) {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE}/operator/audio/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new ApiError(error.detail || 'Upload failed', response.status)
    }
    
    return response.json()
  },

  async getAudioJobs() {
    return request('/operator/audio/jobs')
  },

  async getAudioJob(jobId) {
    return request(`/operator/audio/jobs/${jobId}`)
  },

  async transcribeAudioJob(jobId, language = 'en') {
    return request(`/operator/audio/jobs/${jobId}/transcribe?language=${language}`, {
      method: 'POST',
    })
  },

  async sliceAudioJob(jobId, datasetTypeId, language = 'en') {
    return request(`/operator/audio/jobs/${jobId}/slice`, {
      method: 'POST',
      body: JSON.stringify({
        dataset_type_id: datasetTypeId,
        language
      }),
    })
  },

  async cancelAudioJob(jobId) {
    return request(`/operator/audio/jobs/${jobId}/cancel`, {
      method: 'POST',
    })
  },

  async deleteAudioJob(jobId) {
    return request(`/operator/audio/jobs/${jobId}`, {
      method: 'DELETE',
    })
  },

  async createDatasetItem(itemData) {
    return request('/datasets/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    })
  },

  async bulkUploadZip(datasetTypeId, language, file) {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE}/operator/items/bulk-upload-zip?dataset_type_id=${datasetTypeId}&language=${language}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new ApiError(error.detail || 'Upload failed', response.status)
    }
    
    return response.json()
  },
}
