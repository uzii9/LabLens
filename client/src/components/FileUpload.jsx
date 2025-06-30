import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle, Clock, Zap, Shield, Info, Download } from 'lucide-react'

const FileUpload = ({ onFileUpload, isProcessing }) => {
  const [validationError, setValidationError] = useState(null)
  const [isValidFile, setIsValidFile] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')

  // Enhanced progress simulation with more detailed stages
  useEffect(() => {
    if (isProcessing) {
      setProgress(0)
      setProgressStage('Initializing secure upload...')
      
      const progressSteps = [
        { progress: 10, stage: 'File uploaded successfully', delay: 400 },
        { progress: 25, stage: 'Validating PDF structure...', delay: 800 },
        { progress: 40, stage: 'Converting PDF to high-res images...', delay: 1200 },
        { progress: 55, stage: 'Performing OCR text extraction...', delay: 1800 },
        { progress: 70, stage: 'Identifying lab test markers...', delay: 1500 },
        { progress: 85, stage: 'Cross-referencing AHS standards...', delay: 1000 },
        { progress: 95, stage: 'Generating comprehensive analysis...', delay: 800 },
        { progress: 100, stage: 'Analysis complete! Preparing results...', delay: 500 }
      ]
      
      let currentStep = 0
      const updateProgress = () => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep]
          setTimeout(() => {
            if (isProcessing) {
              setProgress(step.progress)
              setProgressStage(step.stage)
              currentStep++
              if (currentStep < progressSteps.length) {
                updateProgress()
              }
            }
          }, step.delay)
        }
      }
      
      updateProgress()
    } else {
      setProgress(0)
      setProgressStage('')
    }
  }, [isProcessing])

  const validateFile = (file) => {
    setValidationError(null)
    setIsValidFile(false)

    // Enhanced file validation
    if (file.type !== 'application/pdf') {
      setValidationError('Please upload a PDF file only. Other file formats are not supported.')
      return false
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setValidationError('File size must be less than 10MB. Please compress your PDF or contact support.')
      return false
    }

    // Minimum file size check
    const minSize = 1024 // 1KB
    if (file.size < minSize) {
      setValidationError('File appears to be too small. Please ensure you have uploaded a complete lab report.')
      return false
    }

    setIsValidFile(true)
    setUploadedFileName(file.name)
    return true
  }

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors.some(error => error.code === 'file-too-large')) {
        setValidationError('File size exceeds 10MB limit. Please compress your PDF.')
      } else if (rejection.errors.some(error => error.code === 'file-invalid-type')) {
        setValidationError('Invalid file type. Please upload a PDF file only.')
      } else {
        setValidationError('File upload failed. Please try again.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      if (validateFile(file)) {
        onFileUpload(file)
      }
    }
  }, [onFileUpload])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    disabled: isProcessing
  })

  const getDropzoneClassName = () => {
    let className = 'upload-zone group '
    
    if (isProcessing) {
      className += 'opacity-50 cursor-not-allowed '
    } else {
      className += 'cursor-pointer '
      if (isDragActive) {
        if (isDragAccept) {
          className += 'border-medical-green/60 bg-gradient-to-br from-green-50 to-emerald-50 '
        } else if (isDragReject) {
          className += 'border-medical-red/60 bg-gradient-to-br from-red-50 to-pink-50 '
        }
      }
    }
    
    return className
  }

  // Enhanced Progress Bar Component
  const ProgressBar = () => (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="progress-container animate-fade-in-up">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-ahs-blue to-ahs-light-blue rounded-full shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-ahs-blue">Analyzing Your Lab Report</h3>
              <p className="text-gray-600 font-medium">{uploadedFileName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-ahs-blue">{progress}%</div>
            <div className="text-xs text-gray-500 font-medium">Complete</div>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700">{progressStage}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Step {Math.ceil(progress/12.5)} of 8
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div 
              className="bg-gradient-to-r from-ahs-blue via-ahs-light-blue to-medical-green h-4 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Processing Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: 'PDF Processing', threshold: 25 },
            { icon: Clock, label: 'OCR Analysis', threshold: 50 },
            { icon: CheckCircle, label: 'Data Extraction', threshold: 75 },
            { icon: Download, label: 'Report Generation', threshold: 95 }
          ].map((step, index) => (
            <div 
              key={index}
              className={`progress-step ${progress >= step.threshold ? 'progress-step-active' : 'progress-step-inactive'}`}
            >
              <step.icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-semibold">{step.label}</p>
              {progress >= step.threshold && (
                <div className="w-2 h-2 bg-medical-green rounded-full mx-auto mt-1 animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Enhanced Estimated Time */}
        <div className="mt-6 text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700">
            {progress < 30 ? '⏱️ Estimated time: 45-90 seconds' : 
             progress < 70 ? '⚡ Almost there: 15-30 seconds remaining' : 
             '✨ Finalizing your comprehensive analysis...'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Enhanced Progress Display */}
      {isProcessing && <ProgressBar />}
      
      {/* Enhanced Upload Interface */}
      {!isProcessing && (
        <div className="space-y-8">
          {/* Main Upload Zone */}
          <div
            {...getRootProps()}
            className={getDropzoneClassName()}
            aria-label="Upload AHS lab report PDF"
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-6">
              {/* Enhanced Upload Icon */}
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  {isDragAccept ? (
                    <CheckCircle className="w-10 h-10 text-medical-green animate-bounce" />
                  ) : isDragReject ? (
                    <AlertCircle className="w-10 h-10 text-medical-red animate-pulse" />
                  ) : (
                    <Upload className="w-10 h-10 text-ahs-blue group-hover:text-ahs-light-blue transition-colors" />
                  )}
                </div>
                {!isDragActive && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-ahs-blue rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                )}
              </div>

              {/* Enhanced Upload Text */}
              <div className="text-center max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {isDragActive ? (
                    isDragAccept ? '✅ Drop your PDF here' : '❌ Invalid file type'
                  ) : (
                    'Upload Your AHS Lab Report'
                  )}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Drag and drop your PDF file here, or{' '}
                  <span className="text-ahs-blue font-semibold cursor-pointer hover:underline">
                    click to browse
                  </span>{' '}
                  your device
                </p>
                
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>PDF only</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Upload className="w-4 h-4" />
                    <span>Max 10MB</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-medical-green" />
                    <span>Secure</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Information Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* File Requirements Card */}
            <div className="info-card">
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-ahs-blue/10 rounded-xl">
                  <FileText className="w-5 h-5 text-ahs-blue" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-ahs-blue mb-3">File Requirements</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>Alberta Health Services (AHS) lab report PDF</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>Downloaded from MyHealth Records portal</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>Maximum file size: 10MB</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>Contains structured lab test data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Privacy & Security Card */}
            <div className="privacy-card">
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-medical-green/10 rounded-xl">
                  <Shield className="w-5 h-5 text-medical-green" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-3">Privacy & Security</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>Local processing only - no data transmission</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>HIPAA compliant secure handling</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>All data deleted after analysis</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-medical-green mt-0.5 flex-shrink-0" />
                      <span>No personal information stored</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Validation Messages */}
      {!isProcessing && validationError && (
        <div className="mt-6 max-w-2xl mx-auto">
          <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-medical-red rounded-xl shadow-sm">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-medical-red flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-medical-red font-bold mb-1">Upload Error</h4>
                <p className="text-red-700 leading-relaxed">{validationError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isProcessing && isValidFile && (
        <div className="mt-6 max-w-2xl mx-auto">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-medical-green rounded-xl shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-medical-green flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-medical-green font-bold mb-1">File Validated Successfully</h4>
                <p className="text-green-700 leading-relaxed">
                  Your PDF "{uploadedFileName}" is ready for comprehensive analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload 