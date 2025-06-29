const express = require('express')
const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

const router = express.Router()

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  const startTime = Date.now()
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  }

  try {
    // Check basic server health
    healthCheck.checks.server = {
      status: 'ok',
      message: 'Server is running'
    }

    // Check memory usage
    const memUsage = process.memoryUsage()
    healthCheck.checks.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'ok' : 'warning', // 500MB threshold
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    }

    // Check disk space for uploads directory
    try {
      const uploadsDir = path.join(__dirname, '../uploads')
      await fs.mkdir(uploadsDir, { recursive: true })
      
      healthCheck.checks.storage = {
        status: 'ok',
        message: 'Upload directory accessible'
      }
    } catch (error) {
      healthCheck.checks.storage = {
        status: 'error',
        message: 'Upload directory not accessible',
        error: error.message
      }
    }

    // Check Python availability
    try {
      await checkPythonAvailability()
      healthCheck.checks.python = {
        status: 'ok',
        message: 'Python interpreter available'
      }
    } catch (error) {
      healthCheck.checks.python = {
        status: 'error',
        message: 'Python interpreter not available',
        error: error.message
      }
    }

    // Check OCR dependencies
    try {
      await checkOCRDependencies()
      healthCheck.checks.ocr = {
        status: 'ok',
        message: 'OCR dependencies available'
      }
    } catch (error) {
      healthCheck.checks.ocr = {
        status: 'error',
        message: 'OCR dependencies not available',
        error: error.message
      }
    }

    // Check lab definitions file
    try {
      const definitionsPath = path.join(__dirname, '../../data/definitions.json')
      const definitions = JSON.parse(await fs.readFile(definitionsPath, 'utf8'))
      
      healthCheck.checks.definitions = {
        status: 'ok',
        message: 'Lab definitions loaded',
        panelCount: Object.keys(definitions.labPanels || {}).length
      }
    } catch (error) {
      healthCheck.checks.definitions = {
        status: 'error',
        message: 'Lab definitions not available',
        error: error.message
      }
    }

    // Determine overall status
    const hasErrors = Object.values(healthCheck.checks).some(check => check.status === 'error')
    const hasWarnings = Object.values(healthCheck.checks).some(check => check.status === 'warning')
    
    if (hasErrors) {
      healthCheck.status = 'unhealthy'
    } else if (hasWarnings) {
      healthCheck.status = 'degraded'
    }

    // Add response time
    healthCheck.responseTime = `${Date.now() - startTime}ms`

    // Send appropriate status code
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503

    res.status(statusCode).json(healthCheck)

  } catch (error) {
    console.error('Health check error:', error)
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message,
      responseTime: `${Date.now() - startTime}ms`
    })
  }
})

/**
 * GET /api/health/detailed
 * Detailed health check with more comprehensive testing
 */
router.get('/detailed', async (req, res) => {
  const startTime = Date.now()
  const detailedCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      pid: process.pid
    },
    checks: {},
    performance: {}
  }

  try {
    // System resource checks
    const memUsage = process.memoryUsage()
    detailedCheck.system.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    }

    // Load average (Unix systems only)
    if (process.platform !== 'win32') {
      const os = require('os')
      detailedCheck.system.loadAverage = os.loadavg()
      detailedCheck.system.cpuCount = os.cpus().length
    }

    // Performance test - OCR processing simulation
    const perfStart = Date.now()
    try {
      // Simulate a basic OCR operation
      await simulateOCRPerformance()
      detailedCheck.performance.ocrSimulation = {
        status: 'ok',
        duration: `${Date.now() - perfStart}ms`
      }
    } catch (error) {
      detailedCheck.performance.ocrSimulation = {
        status: 'error',
        duration: `${Date.now() - perfStart}ms`,
        error: error.message
      }
    }

    // File system performance
    const fsStart = Date.now()
    try {
      const testFile = path.join(__dirname, '../uploads/health-test.tmp')
      await fs.writeFile(testFile, 'health check test')
      await fs.readFile(testFile)
      await fs.unlink(testFile)
      
      detailedCheck.performance.filesystem = {
        status: 'ok',
        duration: `${Date.now() - fsStart}ms`
      }
    } catch (error) {
      detailedCheck.performance.filesystem = {
        status: 'error',
        duration: `${Date.now() - fsStart}ms`,
        error: error.message
      }
    }

    // Determine overall status
    const hasErrors = Object.values({
      ...detailedCheck.checks, 
      ...detailedCheck.performance
    }).some(check => check.status === 'error')
    
    if (hasErrors) {
      detailedCheck.status = 'unhealthy'
    }

    detailedCheck.responseTime = `${Date.now() - startTime}ms`

    res.json(detailedCheck)

  } catch (error) {
    console.error('Detailed health check error:', error)
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: error.message,
      responseTime: `${Date.now() - startTime}ms`
    })
  }
})

/**
 * Check if Python is available
 */
function checkPythonAvailability() {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['--version'])
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('Python not found'))
      }
    })

    python.on('error', (error) => {
      reject(new Error(`Python check failed: ${error.message}`))
    })
  })
}

/**
 * Check OCR dependencies
 */
async function checkOCRDependencies() {
  // Check if OCR script exists
  const ocrScript = path.join(__dirname, '../../ocr/parse.py')
  try {
    await fs.access(ocrScript)
  } catch {
    throw new Error('OCR script not found')
  }

  // Check Python packages (simplified check)
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['-c', 'import pytesseract, PIL; print("OK")'])
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('Required Python packages not available'))
      }
    })

    python.on('error', (error) => {
      reject(new Error(`OCR dependency check failed: ${error.message}`))
    })
  })
}

/**
 * Simulate OCR performance test
 */
async function simulateOCRPerformance() {
  // Create a simple performance test
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate processing time
      const iterations = 10000
      let sum = 0
      for (let i = 0; i < iterations; i++) {
        sum += Math.random()
      }
      resolve(sum)
    }, 100)
  })
}

module.exports = router 