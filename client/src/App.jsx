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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="animate-fade-in">
          {/* Hero Section */}
          {!labResults && (
            <>
              {!isProcessing && (
                <div className="text-center mb-16 animate-fade-in-up">
                  <div className="max-w-4xl mx-auto">
                    <h1 className="heading-primary mb-6">
                      LabLens
                    </h1>
                    <p className="text-body-large mb-8 max-w-3xl mx-auto">
                      Upload your Alberta Health Services lab report PDF to receive a comprehensive, 
                      easy-to-understand analysis of your test results with personalized health insights.
                    </p>
                    
                    {/* Trust Indicators */}
                    <div className="flex justify-center items-center space-x-8 mb-12 animate-slide-up-delayed">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="w-2 h-2 bg-medical-green rounded-full animate-bounce-gentle"></div>
                        <span className="text-sm font-medium">Privacy Protected</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="w-2 h-2 bg-ahs-blue rounded-full animate-bounce-gentle" style={{animationDelay: '0.2s'}}></div>
                        <span className="text-sm font-medium">AHS Compatible</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="w-2 h-2 bg-medical-yellow rounded-full animate-bounce-gentle" style={{animationDelay: '0.4s'}}></div>
                        <span className="text-sm font-medium">Instant Analysis</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upload Section */}
              <div className="mb-12">
                <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
                
                {error && !isProcessing && (
                  <div className="mt-8 max-w-2xl mx-auto">
                    <ErrorMessage message={error} onDismiss={() => setError(null)} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Results Section */}
          {labResults && !isProcessing && (
            <div className="animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="heading-secondary mb-2">
                    Lab Report Analysis
                  </h2>
                  <p className="text-muted">
                    Complete analysis of your health markers and recommendations
                  </p>
                </div>
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
            <div className="text-center py-12 max-w-2xl mx-auto">
              <div className="card-elevated">
                <ErrorMessage message={error} onDismiss={() => setError(null)} />
                <button
                  onClick={handleReset}
                  className="btn-primary mt-6"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-ahs-blue to-ahs-light-blue text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <p className="text-blue-100 mb-4 leading-relaxed">
                &copy; 2024 LabLens. This tool is for informational purposes only and specializes in AHS lab reports. 
                Always consult with your healthcare provider for medical advice and treatment decisions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-blue-200">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-medical-green rounded-full"></div>
                  <span>No data stored or transmitted</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-medical-green rounded-full"></div>
                  <span>HIPAA compliant processing</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-medical-green rounded-full"></div>
                  <span>Local analysis only</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App 