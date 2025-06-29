import React, { useState } from 'react'
import Header from './components/Header'
import FileUpload from './components/FileUpload'
import LabResults from './components/LabResults'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import { analyzeLabReport } from './services/api'

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [labResults, setLabResults] = useState(null)
  const [error, setError] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)

  const handleFileUpload = async (file) => {
    setIsProcessing(true)
    setError(null)
    setLabResults(null)
    setUploadedFile(file)

    try {
      const results = await analyzeLabReport(file)
      setLabResults(results)
    } catch (err) {
      setError(err.message || 'Failed to analyze lab report. Please try again.')
      console.error('Analysis error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setLabResults(null)
    setError(null)
    setUploadedFile(null)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-fade-in">
          {/* Upload Section */}
          {!labResults && !isProcessing && (
            <div className="mb-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-ahs-blue mb-4">
                  AHS Lab Report Analyzer
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Upload your Alberta Health Services lab report PDF to get a comprehensive analysis 
                  with easy-to-understand explanations of your test results.
                </p>
              </div>
              
              <FileUpload onFileUpload={handleFileUpload} />
              
              {error && (
                <div className="mt-6">
                  <ErrorMessage message={error} onDismiss={() => setError(null)} />
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-12">
              <LoadingSpinner />
              <h2 className="text-xl font-semibold text-ahs-blue mt-4 mb-2">
                Analyzing Your Lab Report
              </h2>
              <p className="text-gray-600">
                Please wait while we extract and analyze your test results...
              </p>
              {uploadedFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Processing: {uploadedFile.name}
                </p>
              )}
            </div>
          )}

          {/* Results Section */}
          {labResults && !isProcessing && (
            <div className="animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-ahs-blue">
                  Lab Report Analysis
                </h2>
                <button
                  onClick={handleReset}
                  className="btn-secondary"
                  aria-label="Upload new report"
                >
                  Upload New Report
                </button>
              </div>
              
              <LabResults results={labResults} fileName={uploadedFile?.name} />
            </div>
          )}

          {/* Error State */}
          {error && !isProcessing && !labResults && (
            <div className="text-center py-8">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
              <button
                onClick={handleReset}
                className="btn-primary mt-4"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-ahs-blue text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; 2024 Alberta Health Services. This tool is for informational purposes only. 
            Always consult with your healthcare provider for medical advice.
          </p>
          <p className="text-xs mt-2 text-blue-200">
            Your privacy is protected. No data is stored or transmitted beyond this session.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App 