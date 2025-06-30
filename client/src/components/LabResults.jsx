import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Info, Download, Calendar, FileText } from 'lucide-react'
import TestResult from './TestResult'
import SummaryCard from './SummaryCard'
import jsPDF from 'jspdf'

const LabResults = ({ results, fileName }) => {
  const [expandedPanels, setExpandedPanels] = useState({})
  const [showAllExplanations, setShowAllExplanations] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const togglePanel = (panelId) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }))
  }

  const expandAllPanels = () => {
    const allPanels = {}
    Object.keys(results.panels || {}).forEach(panelId => {
      allPanels[panelId] = true
    })
    setExpandedPanels(allPanels)
  }

  const collapseAllPanels = () => {
    setExpandedPanels({})
  }

  // Calculate summary statistics
  const getSummaryStats = () => {
    let totalTests = 0
    let normalCount = 0
    let borderlineCount = 0
    let abnormalCount = 0
    let criticalCount = 0

    Object.values(results.panels || {}).forEach(panel => {
      Object.values(panel.tests || {}).forEach(test => {
        totalTests++
        switch (test.flag) {
          case 'normal':
            normalCount++
            break
          case 'borderline':
            borderlineCount++
            break
          case 'abnormal':
            abnormalCount++
            break
          case 'critical':
            criticalCount++
            break
        }
      })
    })

    return { totalTests, normalCount, borderlineCount, abnormalCount, criticalCount }
  }

  const stats = getSummaryStats()

  // Get flagged tests for quick overview
  const getFlaggedTests = () => {
    const flagged = []
    Object.entries(results.panels || {}).forEach(([panelId, panel]) => {
      Object.entries(panel.tests || {}).forEach(([testId, test]) => {
        if (test.flag !== 'normal') {
          flagged.push({
            panelName: panel.name,
            testName: test.name,
            value: test.value,
            unit: test.unit,
            flag: test.flag,
            referenceRange: test.referenceRange,
            explanation: test.explanation
          })
        }
      })
    })
    return flagged.sort((a, b) => {
      const flagOrder = { critical: 0, abnormal: 1, borderline: 2 }
      return flagOrder[a.flag] - flagOrder[b.flag]
    })
  }

  const flaggedTests = getFlaggedTests()

  // Professional PDF Export functionality
  const exportSummary = async () => {
    setIsExporting(true)
    
    try {
      // Validate data before starting PDF generation
      if (!results || !results.panels || Object.keys(results.panels).length === 0) {
        throw new Error('No test results available to export')
      }

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin
      
      const stats = getSummaryStats()
      const flaggedTests = getFlaggedTests()
      
      // Helper function to safely get text value
      const safeText = (value) => {
        if (value === null || value === undefined) return 'N/A'
        return String(value)
      }
      
      // Helper function to add text with word wrapping
      const addText = (text, x, y, options = {}) => {
        const fontSize = options.fontSize || 10
        const maxWidth = options.maxWidth || (pageWidth - 2 * margin)
        const lineHeight = options.lineHeight || fontSize * 1.2
        
        pdf.setFontSize(fontSize)
        if (options.style) {
          try {
            pdf.setFont(undefined, options.style)
          } catch (fontError) {
            console.warn('Font style not supported, using default:', options.style)
          }
        }
        
        const safeTextValue = safeText(text)
        const lines = pdf.splitTextToSize(safeTextValue, maxWidth)
        
        lines.forEach((line, index) => {
          if (y + index * lineHeight > pageHeight - margin) {
            pdf.addPage()
            y = margin
          }
          pdf.text(String(line), x, y + index * lineHeight)
        })
        
        return y + lines.length * lineHeight
      }
      
      // Helper function to add a new page if needed
      const checkPageSpace = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }
      
      // Header
      pdf.setFontSize(20)
      try {
        pdf.setFont(undefined, 'bold')
      } catch (e) {
        console.warn('Bold font not available, using default')
      }
      pdf.setTextColor(0, 51, 102) // AHS Blue
      pdf.text('AHS LAB REPORT ANALYSIS', margin, yPosition)
      yPosition += 15
      
      // Horizontal line
      pdf.setDrawColor(0, 51, 102)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 15
      
      // Report Information
      pdf.setFontSize(14)
      try {
        pdf.setFont(undefined, 'bold')
      } catch (e) {
        console.warn('Bold font not available, using default')
      }
      pdf.setTextColor(0, 0, 0)
      pdf.text('Report Information', margin, yPosition)
      yPosition += 10
      
      pdf.setFontSize(10)
      try {
        pdf.setFont(undefined, 'normal')
      } catch (e) {
        console.warn('Normal font not available, using default')
      }
      pdf.text(`File: ${safeText(fileName) || 'Lab Report'}`, margin + 5, yPosition)
      yPosition += 6
      pdf.text(`Analysis Date: ${new Date().toLocaleDateString()}`, margin + 5, yPosition)
      yPosition += 6
      pdf.text(`Analysis Time: ${new Date().toLocaleTimeString()}`, margin + 5, yPosition)
      yPosition += 15
      
      // Summary Statistics Box
      checkPageSpace(40)
      pdf.setFillColor(240, 248, 255) // Light blue background
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'F')
      pdf.setDrawColor(0, 51, 102)
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'S')
      
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'bold')
      pdf.text('Test Summary Overview', margin + 5, yPosition + 5)
      
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      const summaryY = yPosition + 15
      pdf.text(`Total Tests: ${stats.totalTests}`, margin + 5, summaryY)
      pdf.text(`Normal: ${stats.normalCount}`, margin + 60, summaryY)
      pdf.text(`Borderline: ${stats.borderlineCount}`, margin + 5, summaryY + 8)
      pdf.text(`Abnormal: ${stats.abnormalCount}`, margin + 60, summaryY + 8)
      if (stats.criticalCount > 0) {
        pdf.setTextColor(200, 0, 0)
        pdf.setFont(undefined, 'bold')
        pdf.text(`⚠ Critical: ${stats.criticalCount}`, margin + 120, summaryY)
        pdf.setTextColor(0, 0, 0)
        pdf.setFont(undefined, 'normal')
      }
      
      yPosition += 45
      
      // Flagged Tests Section
      if (flaggedTests.length > 0) {
        checkPageSpace(30)
        pdf.setFontSize(14)
        pdf.setFont(undefined, 'bold')
        pdf.setTextColor(200, 0, 0)
        pdf.text(`⚠ Tests Requiring Attention (${flaggedTests.length})`, margin, yPosition)
        yPosition += 12
        
        flaggedTests.forEach((test, index) => {
          try {
            checkPageSpace(25)
            
            // Test box
            const boxHeight = 20
            pdf.setFillColor(255, 245, 245) // Light red background
            pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, boxHeight, 'F')
            pdf.setDrawColor(200, 0, 0)
            pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, boxHeight, 'S')
            
            pdf.setFontSize(11)
            try {
              pdf.setFont(undefined, 'bold')
            } catch (e) {
              console.warn('Bold font not available')
            }
            pdf.setTextColor(0, 0, 0)
            pdf.text(`${index + 1}. ${safeText(test.testName)}`, margin + 3, yPosition + 5)
            
            pdf.setFontSize(9)
            try {
              pdf.setFont(undefined, 'normal')
            } catch (e) {
              console.warn('Normal font not available')
            }
            pdf.text(`Panel: ${safeText(test.panelName)}`, margin + 3, yPosition + 10)
            pdf.text(`Value: ${safeText(test.value)} ${safeText(test.unit)}`, margin + 80, yPosition + 5)
            pdf.text(`Reference: ${safeText(test.referenceRange)}`, margin + 80, yPosition + 10)
            
            // Flag indicator
            const flagColors = {
              borderline: [255, 193, 7],
              abnormal: [220, 53, 69],
              critical: [139, 0, 0]
            }
            const color = flagColors[test.flag] || [128, 128, 128]
            pdf.setFillColor(...color)
            pdf.rect(pageWidth - margin - 25, yPosition + 2, 20, 8, 'F')
            pdf.setFontSize(8)
            pdf.setTextColor(255, 255, 255)
            try {
              pdf.setFont(undefined, 'bold')
            } catch (e) {
              console.warn('Bold font not available')
            }
            pdf.text(safeText(test.flag).toUpperCase(), pageWidth - margin - 23, yPosition + 7)
            
            yPosition += boxHeight + 5
          } catch (testError) {
            console.error('Error processing flagged test:', testError, test)
            // Skip this test and continue
            yPosition += 25
          }
        })
        
        yPosition += 10
      }
      
      // Detailed Results by Panel
      checkPageSpace(20)
      pdf.setFontSize(14)
      pdf.setFont(undefined, 'bold')
      pdf.setTextColor(0, 51, 102)
      pdf.text('Detailed Test Results by Panel', margin, yPosition)
      yPosition += 15
      
      Object.entries(results.panels || {}).forEach(([panelId, panel]) => {
        try {
          checkPageSpace(30)
          
          // Panel header
          pdf.setFontSize(12)
          try {
            pdf.setFont(undefined, 'bold')
          } catch (e) {
            console.warn('Bold font not available')
          }
          pdf.setTextColor(0, 51, 102)
          pdf.text(safeText(panel.name || panelId), margin, yPosition)
          yPosition += 8
          
          pdf.setFontSize(9)
          try {
            pdf.setFont(undefined, 'italic')
          } catch (e) {
            console.warn('Italic font not available')
          }
          pdf.setTextColor(100, 100, 100)
          yPosition = addText(panel.description || 'No description available', margin, yPosition, { fontSize: 9, maxWidth: pageWidth - 2 * margin })
          yPosition += 5
        
        // Tests table header
        pdf.setFontSize(9)
        pdf.setFont(undefined, 'bold')
        pdf.setTextColor(0, 0, 0)
        pdf.text('Test Name', margin + 5, yPosition)
        pdf.text('Value', margin + 80, yPosition)
        pdf.text('Unit', margin + 110, yPosition)
        pdf.text('Reference Range', margin + 130, yPosition)
        pdf.text('Status', pageWidth - margin - 25, yPosition)
        
        // Underline
        pdf.setDrawColor(0, 0, 0)
        pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2)
        yPosition += 8
        
          // Tests
          Object.entries(panel.tests || {}).forEach(([testId, test]) => {
            try {
              checkPageSpace(12)
              
              pdf.setFontSize(8)
              try {
                pdf.setFont(undefined, 'normal')
              } catch (e) {
                console.warn('Normal font not available')
              }
              
              // Alternate row background
              if (Object.keys(panel.tests).indexOf(testId) % 2 === 0) {
                pdf.setFillColor(250, 250, 250)
                pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F')
              }
              
              pdf.setTextColor(0, 0, 0)
              pdf.text(safeText(test.name), margin + 5, yPosition + 4)
              pdf.text(safeText(test.value), margin + 80, yPosition + 4)
              pdf.text(safeText(test.unit), margin + 110, yPosition + 4)
              pdf.text(safeText(test.referenceRange), margin + 130, yPosition + 4)
              
              // Status indicator
              const statusColors = {
                normal: [40, 167, 69],
                borderline: [255, 193, 7],
                abnormal: [220, 53, 69],
                critical: [139, 0, 0]
              }
              const statusColor = statusColors[test.flag] || [128, 128, 128]
              pdf.setTextColor(...statusColor)
              try {
                pdf.setFont(undefined, 'bold')
              } catch (e) {
                console.warn('Bold font not available')
              }
              pdf.text(test.flag === 'normal' ? '✓' : '⚠', pageWidth - margin - 15, yPosition + 4)
              
              yPosition += 10
            } catch (testError) {
              console.error('Error processing test:', testError, test)
              yPosition += 10 // Skip this test
            }
          })
          
          yPosition += 10
        } catch (panelError) {
          console.error('Error processing panel:', panelError, panel)
          yPosition += 30 // Skip this panel
        }
      })
      
      // Medical Disclaimer
      checkPageSpace(40)
      pdf.setFillColor(255, 248, 220) // Light yellow background
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'F')
      pdf.setDrawColor(255, 193, 7)
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'S')
      
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'bold')
      pdf.setTextColor(133, 100, 4)
      pdf.text('⚠ Important Medical Disclaimer', margin + 5, yPosition + 5)
      
      pdf.setFontSize(8)
      pdf.setFont(undefined, 'normal')
      pdf.setTextColor(0, 0, 0)
      const disclaimerText = 'This analysis is for informational purposes only and should not replace professional medical advice. Lab results should always be interpreted by qualified healthcare professionals in the context of your complete medical history, symptoms, and physical examination. If you have questions about your results or health concerns, please consult with your physician or healthcare provider.'
      addText(disclaimerText, margin + 5, yPosition + 12, { fontSize: 8, maxWidth: pageWidth - 2 * margin - 10 })
      
      // Footer
      pdf.setFontSize(7)
      pdf.setTextColor(128, 128, 128)
              pdf.text('Generated by LabLens v1.0.0 - AHS Lab Report Analyzer', margin, pageHeight - 10)
      pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, pageWidth - margin - 20, pageHeight - 10)
      
      // Save the PDF
      const pdfFileName = `AHS_Lab_Report_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(pdfFileName)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Error generating PDF. Please try again.'
      
      if (error.message === 'No test results available to export') {
        errorMessage = 'No test results available to export. Please analyze a lab report first.'
      } else if (error.message && error.message.includes('jsPDF')) {
        errorMessage = 'PDF generation library error. Please refresh the page and try again.'
      } else if (error.message && error.message.includes('font')) {
        errorMessage = 'Font rendering error. The PDF may still be generated with default fonts.'
      }
      
      alert(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-ahs-blue mb-2">Report Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{fileName || 'Lab Report'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Analyzed: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <button 
            className={`btn-secondary flex items-center space-x-2 ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`} 
            onClick={exportSummary}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ahs-blue"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Summary</span>
              </>
            )}
          </button>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard
            title="Total Tests"
            value={stats.totalTests}
            color="blue"
          />
          <SummaryCard
            title="Normal"
            value={stats.normalCount}
            color="green"
          />
          <SummaryCard
            title="Borderline"
            value={stats.borderlineCount}
            color="yellow"
          />
          <SummaryCard
            title="Abnormal"
            value={stats.abnormalCount}
            color="red"
          />
          <SummaryCard
            title="Critical"
            value={stats.criticalCount}
            color="red"
            critical={true}
          />
        </div>
      </div>

      {/* Flagged Tests Summary */}
      {flaggedTests.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-ahs-blue mb-4">
            Tests Requiring Attention ({flaggedTests.length})
          </h3>
          <div className="space-y-3">
            {flaggedTests.map((test, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800">{test.testName}</h4>
                    <p className="text-sm text-gray-600">{test.panelName}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{test.value} {test.unit}</span>
                      <span className={`medical-flag-${test.flag}`}>
                        {test.flag.charAt(0).toUpperCase() + test.flag.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Reference: {test.referenceRange}
                    </p>
                  </div>
                </div>
                {showAllExplanations && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-ahs-blue">
                    <p className="text-sm text-gray-700">{test.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setShowAllExplanations(!showAllExplanations)}
            className="mt-4 text-ahs-blue hover:text-ahs-light-blue font-medium text-sm flex items-center space-x-1"
          >
            <Info className="w-4 h-4" />
            <span>
              {showAllExplanations ? 'Hide' : 'Show'} Explanations
            </span>
          </button>
        </div>
      )}

      {/* Panel Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-ahs-blue">
          Detailed Test Results by Panel
        </h3>
        <div className="space-x-2">
          <button
            onClick={expandAllPanels}
            className="text-sm text-ahs-blue hover:text-ahs-light-blue"
          >
            Expand All
          </button>
          <button
            onClick={collapseAllPanels}
            className="text-sm text-ahs-blue hover:text-ahs-light-blue"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Test Panels */}
      <div className="space-y-4">
        {Object.entries(results.panels || {}).map(([panelId, panel]) => {
          const isExpanded = expandedPanels[panelId]
          const panelTestCount = Object.keys(panel.tests || {}).length
          const panelFlaggedCount = Object.values(panel.tests || {}).filter(
            test => test.flag !== 'normal'
          ).length

          return (
            <div key={panelId} className="card">
              <button
                onClick={() => togglePanel(panelId)}
                className="w-full flex justify-between items-center text-left"
                aria-expanded={isExpanded}
              >
                <div>
                  <h4 className="text-lg font-semibold text-ahs-blue">{panel.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{panel.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-gray-500">
                      {panelTestCount} test{panelTestCount !== 1 ? 's' : ''}
                    </span>
                    {panelFlaggedCount > 0 && (
                      <span className="text-medical-red font-medium">
                        {panelFlaggedCount} flagged
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-6 space-y-4">
                  {Object.entries(panel.tests || {}).map(([testId, test]) => (
                    <TestResult
                      key={testId}
                      test={test}
                      testId={testId}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Medical Disclaimer */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-yellow-600 mt-1" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">Important Medical Disclaimer</h4>
            <p className="text-yellow-700 text-sm leading-relaxed">
              This analysis is for informational purposes only and should not replace professional medical advice. 
              Lab results should always be interpreted by qualified healthcare professionals in the context of your 
              complete medical history, symptoms, and physical examination. If you have questions about your results 
              or health concerns, please consult with your physician or healthcare provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabResults 