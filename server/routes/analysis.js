const express = require('express')
const multer = require('multer')
const { body, validationResult } = require('express-validator')
const path = require('path')
const fs = require('fs').promises
const axios = require('axios')
const FormData = require('form-data')

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `lab-report-${uniqueSuffix}.pdf`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false)
    }
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.pdf') {
      return cb(new Error('File must have .pdf extension'), false)
    }

    cb(null, true)
  }
})

// Middleware to clean up uploaded files
const cleanupFile = async (filePath) => {
  try {
    if (filePath) {
      await fs.unlink(filePath)
      console.log(`Cleaned up file: ${filePath}`)
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error)
  }
}

/**
 * POST /api/analyze
 * Analyze lab report PDF
 */
router.post('/analyze', upload.single('labReport'), async (req, res) => {
  let uploadedFilePath = null
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a PDF file'
      })
    }

    uploadedFilePath = req.file.path
    console.log(`File uploaded: ${req.file.originalname} (${req.file.size} bytes)`)

    // Validate file size
    if (req.file.size === 0) {
      return res.status(400).json({
        error: 'Empty file',
        message: 'The uploaded file is empty'
      })
    }

    // Record start time for performance metrics
    const startTime = Date.now()

    // Call Python OCR service
    const ocrResults = await callOCRService(uploadedFilePath, req.file.originalname)
    
    // Parse the OCR results into structured lab data
    const labAnalysis = await parseLabResults(ocrResults)

    // Calculate processing time
    const processingTime = Date.now() - startTime

    // Prepare response
    const response = {
      success: true,
      panels: labAnalysis.panels,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTime,
        ocrConfidence: ocrResults.confidence || null,
        analyzedAt: new Date().toISOString()
      },
      summary: calculateSummary(labAnalysis.panels)
    }

    res.json(response)

  } catch (error) {
    console.error('Analysis error:', error)
    
    // Send appropriate error response
    if (error.message.includes('OCR')) {
      res.status(422).json({
        error: 'OCR Processing Failed',
        message: 'Unable to extract text from the PDF. Please ensure it is a valid AHS lab report.'
      })
    } else if (error.message.includes('parsing')) {
      res.status(422).json({
        error: 'Parsing Failed',
        message: 'Unable to parse lab results from the document. Please ensure it is a valid AHS lab report format.'
      })
    } else {
      res.status(500).json({
        error: 'Analysis Failed',
        message: 'An error occurred while analyzing the lab report. Please try again.'
      })
    }
  } finally {
    // Clean up uploaded file
    if (uploadedFilePath) {
      await cleanupFile(uploadedFilePath)
    }
  }
})

/**
 * Call Python OCR service
 */
async function callOCRService(filePath, fileName) {
  try {
    const pythonScript = path.join(__dirname, '../../ocr/parse.py')
    
    // Check if Python script exists
    try {
      await fs.access(pythonScript)
    } catch {
      throw new Error('OCR service not available - Python script not found')
    }

    // Create form data for Python script
    const formData = new FormData()
    const fileStream = require('fs').createReadStream(filePath)
    formData.append('file', fileStream, fileName)

    // Call Python OCR service (running on separate port or as subprocess)
    // For now, we'll simulate calling a Python service
    const { spawn } = require('child_process')
    
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [pythonScript, filePath])
      let output = ''
      let errorOutput = ''
      let isResolved = false

      // Add timeout (60 seconds for OCR processing)
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          python.kill('SIGTERM')
          reject(new Error('OCR processing timeout - file may be too large or complex'))
        }
      }, 60000)

      python.stdout.on('data', (data) => {
        output += data.toString()
      })

      python.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      python.on('close', (code) => {
        clearTimeout(timeout)
        if (isResolved) return // Already timed out
        isResolved = true

        if (code !== 0) {
          console.error('Python OCR error (exit code:', code, '):', errorOutput)
          console.error('Python stdout:', output)
          reject(new Error(`OCR processing failed: ${errorOutput || 'Unknown error'}`))
        } else {
          try {
            const result = JSON.parse(output)
            if (!result.success) {
              console.error('OCR failed:', result.error)
              reject(new Error(`OCR: ${result.error || 'Unknown error'}`))
            } else {
              resolve(result)
            }
          } catch (parseError) {
            console.error('Failed to parse OCR output:', parseError)
            console.error('Raw output:', output)
            reject(new Error('OCR service returned invalid response'))
          }
        }
      })

      python.on('error', (error) => {
        clearTimeout(timeout)
        if (isResolved) return
        isResolved = true
        console.error('Failed to start Python process:', error)
        reject(new Error('OCR service unavailable'))
      })
    })

  } catch (error) {
    console.error('OCR service error:', error)
    throw new Error(`OCR processing failed: ${error.message}`)
  }
}

/**
 * Parse OCR results into structured lab data
 */
async function parseLabResults(ocrResults) {
  try {
    // Load lab definitions
    const definitionsPath = path.join(__dirname, '../../data/definitions.json')
    const definitions = JSON.parse(await fs.readFile(definitionsPath, 'utf8'))

    // Extract structured data from OCR text
    const extractedText = ocrResults.text || ocrResults.extractedText || ''
    
    if (!extractedText || extractedText.length < 100) {
      throw new Error('parsing: Insufficient text extracted from PDF')
    }

    // Parse lab panels and tests
    const panels = {}
    
    // Process each panel type from definitions
    Object.entries(definitions.labPanels).forEach(([panelId, panelDef]) => {
      const panelTests = extractTestsForPanel(extractedText, panelDef, definitions)
      
      if (Object.keys(panelTests).length > 0) {
        panels[panelId] = {
          name: panelDef.name,
          description: panelDef.description,
          tests: panelTests
        }
      }
    })

    if (Object.keys(panels).length === 0) {
      throw new Error('parsing: No recognizable lab tests found in the document')
    }

    return { panels }

  } catch (error) {
    console.error('Lab parsing error:', error)
    throw new Error(`parsing: ${error.message}`)
  }
}

/**
 * Extract tests for a specific panel
 */
function extractTestsForPanel(text, panelDef, definitions) {
  const tests = {}
  
  Object.entries(panelDef.tests).forEach(([testId, testDef]) => {
    const extractedTest = extractSingleTest(text, testDef, testId)
    if (extractedTest) {
      tests[testId] = extractedTest
    }
  })

  return tests
}

/**
 * Extract a single test result from text
 */
function extractSingleTest(text, testDef, testId) {
  try {
    // Create patterns to match test results
    const testNamePatterns = [
      testDef.name,
      testDef.name.replace(/[()]/g, ''), // Remove parentheses
      testId.toUpperCase(),
      testId.replace(/_/g, ' ').toUpperCase()
    ]

    let value = null
    let referenceRange = null
    let flag = 'normal'

    // Search for test patterns in text
    for (const pattern of testNamePatterns) {
      const regex = new RegExp(`${pattern}\\s*:?\\s*([0-9.]+)\\s*(${testDef.unit})?`, 'i')
      const match = text.match(regex)
      
      if (match) {
        value = parseFloat(match[1])
        break
      }
    }

    // If no value found, skip this test
    if (value === null) {
      return null
    }

    // Determine reference range and flag
    const refRange = testDef.referenceRange
    if (typeof refRange === 'object') {
      if (refRange.min !== undefined && refRange.max !== undefined) {
        referenceRange = `${refRange.min} - ${refRange.max} ${testDef.unit}`
        flag = determineFlag(value, refRange.min, refRange.max)
      } else if (refRange.male || refRange.female) {
        // Use male range as default (would need gender detection in real implementation)
        const range = refRange.male || refRange.female
        referenceRange = `${range.min} - ${range.max} ${testDef.unit}`
        flag = determineFlag(value, range.min, range.max)
      }
    } else {
      referenceRange = refRange
    }

    return {
      name: testDef.name,
      value,
      unit: testDef.unit,
      referenceRange,
      referenceRangeNumeric: typeof refRange === 'object' ? refRange : null,
      flag,
      explanation: testDef.explanation,
      category: testDef.category
    }

  } catch (error) {
    console.error(`Error extracting test ${testId}:`, error)
    return null
  }
}

/**
 * Determine flag based on value and reference range
 */
function determineFlag(value, min, max) {
  if (value < min) {
    return value < min * 0.8 ? 'critical' : value < min * 0.9 ? 'abnormal' : 'borderline'
  } else if (value > max) {
    return value > max * 1.2 ? 'critical' : value > max * 1.1 ? 'abnormal' : 'borderline'
  }
  return 'normal'
}

/**
 * Calculate summary statistics
 */
function calculateSummary(panels) {
  let totalTests = 0
  let normalCount = 0
  let borderlineCount = 0
  let abnormalCount = 0
  let criticalCount = 0

  Object.values(panels).forEach(panel => {
    Object.values(panel.tests).forEach(test => {
      totalTests++
      switch (test.flag) {
        case 'normal': normalCount++; break
        case 'borderline': borderlineCount++; break
        case 'abnormal': abnormalCount++; break
        case 'critical': criticalCount++; break
      }
    })
  })

  return {
    totalTests,
    normalCount,
    borderlineCount,
    abnormalCount,
    criticalCount,
    flaggedTests: totalTests - normalCount
  }
}

/**
 * GET /api/file-info
 * Get supported file formats and limitations
 */
router.get('/file-info', (req, res) => {
  res.json({
    supportedFormats: ['application/pdf'],
    maxFileSize: 10 * 1024 * 1024,
    maxFileSizeString: '10MB',
    supportedReports: [
      'Alberta Health Services Lab Reports',
      'MyHealth Records PDF exports'
    ],
    requirements: [
      'PDF format only',
      'Text-based (not scanned images)',
      'Standard AHS lab report format',
      'Maximum file size: 10MB'
    ]
  })
})

module.exports = router 