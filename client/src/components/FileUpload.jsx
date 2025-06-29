import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

const FileUpload = ({ onFileUpload }) => {
  const [validationError, setValidationError] = useState(null)
  const [isValidFile, setIsValidFile] = useState(false)

  const validateFile = (file) => {
    // Reset states
    setValidationError(null)
    setIsValidFile(false)

    // Check file type
    if (file.type !== 'application/pdf') {
      setValidationError('Please upload a PDF file only.')
      return false
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setValidationError('File size must be less than 10MB.')
      return false
    }

    // Check if filename suggests it's an AHS report (optional validation)
    const fileName = file.name.toLowerCase()
    if (!fileName.includes('report') && !fileName.includes('lab') && !fileName.includes('myhealth')) {
      // This is a soft warning, not a hard error
      console.warn('File name does not appear to be an AHS lab report, but proceeding anyway.')
    }

    setIsValidFile(true)
    return true
  }

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setValidationError('Invalid file type. Please upload a PDF file.')
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
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const getDropzoneClassName = () => {
    let className = 'upload-zone cursor-pointer transition-all duration-200 '
    
    if (isDragActive) {
      className += 'dragover '
    }
    if (isDragAccept) {
      className += 'border-medical-green bg-green-50 '
    }
    if (isDragReject) {
      className += 'border-medical-red bg-red-50 '
    }
    
    return className
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={getDropzoneClassName()}
        aria-label="Upload AHS lab report PDF"
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {/* Upload Icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
            {isDragAccept ? (
              <CheckCircle className="w-8 h-8 text-medical-green" />
            ) : isDragReject ? (
              <AlertCircle className="w-8 h-8 text-medical-red" />
            ) : (
              <Upload className="w-8 h-8 text-ahs-blue" />
            )}
          </div>

          {/* Upload Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isDragActive ? (
                isDragAccept ? 'Drop your PDF here' : 'Invalid file type'
              ) : (
                'Upload Your AHS Lab Report'
              )}
            </h3>
            
            <p className="text-gray-600 mb-2">
              Drag and drop your PDF file here, or click to browse
            </p>
            
            <p className="text-sm text-gray-500">
              Supports: PDF files up to 10MB
            </p>
          </div>

          {/* File Requirements */}
          <div className="bg-blue-50 rounded-lg p-4 w-full max-w-md">
            <div className="flex items-start space-x-2">
              <FileText className="w-5 h-5 text-ahs-blue mt-0.5" />
              <div className="text-sm">
                <h4 className="font-medium text-ahs-blue mb-1">File Requirements:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Alberta Health Services lab report PDF</li>
                  <li>• From MyHealth Records portal</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Contains structured lab test data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {validationError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-medical-red" />
            <p className="text-medical-red font-medium">Upload Error</p>
          </div>
          <p className="text-red-700 mt-1">{validationError}</p>
        </div>
      )}

      {isValidFile && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-medical-green" />
            <p className="text-medical-green font-medium">Valid File</p>
          </div>
          <p className="text-green-700 mt-1">Your PDF is ready for analysis.</p>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Privacy & Security</h4>
        <p className="text-sm text-gray-600">
          Your lab report is processed locally and securely. No personal health information 
          is stored or transmitted to external servers. All data is deleted after analysis.
        </p>
      </div>
    </div>
  )
}

export default FileUpload 