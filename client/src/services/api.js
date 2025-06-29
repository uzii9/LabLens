import axios from 'axios'

// Configure axios defaults
const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60 seconds for OCR processing
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response received:`, response.status)
    return response
  },
  (error) => {
    console.error('Response error:', error)
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - The analysis is taking longer than expected. Please try again.')
    }
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          throw new Error(data.message || 'Invalid file or request. Please check your PDF and try again.')
        case 413:
          throw new Error('File too large. Please ensure your PDF is under 10MB.')
        case 415:
          throw new Error('Unsupported file type. Please upload a PDF file.')
        case 422:
          throw new Error('Unable to extract text from PDF. Please ensure it\'s a valid AHS lab report.')
        case 500:
          throw new Error('Server error occurred during analysis. Please try again later.')
        default:
          throw new Error(data.message || `Server error (${status}). Please try again.`)
      }
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Unable to connect to server. Please check your connection and try again.')
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred. Please try again.')
    }
  }
)

/**
 * Analyze a lab report PDF file
 * @param {File} file - The PDF file to analyze
 * @returns {Promise<Object>} - The analysis results
 */
export const analyzeLabReport = async (file) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided')
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF')
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB')
    }

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('labReport', file)
    formData.append('fileName', file.name)

    // Make request to analyze endpoint
    const response = await api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Track upload progress (optional)
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })

    // Validate response structure
    if (!response.data) {
      throw new Error('Invalid response from server')
    }

    const results = response.data

    // Validate required fields
    if (!results.panels || typeof results.panels !== 'object') {
      throw new Error('Invalid analysis results - missing test panels')
    }

    // Transform and validate the data structure
    const transformedResults = {
      panels: {},
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        analyzedAt: new Date().toISOString(),
        processingTime: results.processingTime || null,
        ocrConfidence: results.ocrConfidence || null
      }
    }

    // Process each panel
    Object.entries(results.panels).forEach(([panelId, panel]) => {
      if (!panel.name || !panel.tests) {
        console.warn(`Invalid panel structure for ${panelId}`)
        return
      }

      transformedResults.panels[panelId] = {
        name: panel.name,
        description: panel.description || '',
        tests: {}
      }

      // Process each test in the panel
      Object.entries(panel.tests).forEach(([testId, test]) => {
        if (!test.name || test.value === undefined) {
          console.warn(`Invalid test structure for ${testId}`)
          return
        }

        transformedResults.panels[panelId].tests[testId] = {
          name: test.name,
          value: test.value,
          unit: test.unit || '',
          referenceRange: test.referenceRange || '',
          referenceRangeNumeric: test.referenceRangeNumeric || null,
          flag: test.flag || 'normal',
          explanation: test.explanation || 'No explanation available.',
          category: test.category || 'general'
        }
      })
    })

    console.log('Analysis completed successfully:', transformedResults)
    return transformedResults

  } catch (error) {
    console.error('Lab report analysis failed:', error)
    throw error
  }
}

/**
 * Get health check status
 * @returns {Promise<Object>} - Server health status
 */
export const getHealthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error('Health check failed:', error)
    throw new Error('Unable to connect to analysis service')
  }
}

/**
 * Get supported file formats and limitations
 * @returns {Promise<Object>} - File format information
 */
export const getFileInfo = async () => {
  try {
    const response = await api.get('/file-info')
    return response.data
  } catch (error) {
    console.error('File info request failed:', error)
    // Return default info if endpoint not available
    return {
      supportedFormats: ['application/pdf'],
      maxFileSize: 10 * 1024 * 1024,
      maxFileSizeString: '10MB'
    }
  }
}

export default api 