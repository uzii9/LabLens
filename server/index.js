const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('dotenv').config()

// Import routes
const analysisRoutes = require('./routes/analysis')
const healthRoutes = require('./routes/health')

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://ahs-lab-analyzer.vercel.app'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', limiter)

// File upload rate limiting (more restrictive)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit uploads per IP
  message: {
    error: 'Too many file uploads from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
})

app.use('/api/analyze', uploadLimiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// API Routes
app.use('/api/health', healthRoutes)
app.use('/api', analysisRoutes)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from client build
  app.use(express.static(path.join(__dirname, '../client/dist')))
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
} else {
  // Development welcome message
  app.get('/', (req, res) => {
    res.json({
      message: 'LabLens API - AHS Lab Report Analyzer',
      version: '1.0.0',
      environment: 'development',
      endpoints: {
        health: '/api/health',
        analyze: '/api/analyze',
        fileInfo: '/api/file-info'
      }
    })
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', err)

  // Handle different error types
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'File size exceeds the 10MB limit',
      maxSize: '10MB'
    })
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Too many files',
      message: 'Only one file can be uploaded at a time'
    })
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected field',
      message: 'Invalid file field name'
    })
  }

  // Validation errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    })
  }

  // Default error response
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: ['/api/health', '/api/analyze', '/api/file-info']
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 LabLens API server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`)
    console.log(`📄 File Upload: http://localhost:${PORT}/api/analyze`)
  }
})

// Handle server startup errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`)
  } else {
    console.error('❌ Server startup error:', err)
  }
  process.exit(1)
})

module.exports = app 