import React, { useState } from 'react'
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const TestResult = ({ test, testId }) => {
  const [showExplanation, setShowExplanation] = useState(false)

  const getFlagIcon = (flag) => {
    switch (flag) {
      case 'abnormal':
        return test.value > test.referenceRangeNumeric?.max ? 
          <TrendingUp className="w-4 h-4" /> : 
          <TrendingDown className="w-4 h-4" />
      case 'borderline':
        return <Minus className="w-4 h-4" />
      case 'critical':
        return test.value > test.referenceRangeNumeric?.max ? 
          <TrendingUp className="w-4 h-4" /> : 
          <TrendingDown className="w-4 h-4" />
      default:
        return null
    }
  }

  const getFlagDescription = (flag, value, referenceRange) => {
    switch (flag) {
      case 'normal':
        return 'Within normal range'
      case 'borderline':
        return 'Slightly outside normal range'
      case 'abnormal':
        return value > referenceRange?.max ? 'Above normal range' : 'Below normal range'
      case 'critical':
        return value > referenceRange?.max ? 'Critically high' : 'Critically low'
      default:
        return 'Unknown status'
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        {/* Test Name and Value */}
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h5 className="font-medium text-gray-800">{test.name}</h5>
            {test.flag !== 'normal' && (
              <div className="flex items-center space-x-1">
                {getFlagIcon(test.flag)}
                <span className={`medical-flag-${test.flag}`}>
                  {test.flag.charAt(0).toUpperCase() + test.flag.slice(1)}
                </span>
              </div>
            )}
          </div>
          
          {/* Value and Unit */}
          <div className="mt-2">
            <span className="text-2xl font-bold text-ahs-blue">
              {test.value}
            </span>
            {test.unit && (
              <span className="text-gray-600 ml-2">{test.unit}</span>
            )}
          </div>

          {/* Reference Range */}
          <div className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Reference Range: </span>
            <span>{test.referenceRange || 'Not available'}</span>
          </div>

          {/* Flag Description */}
          <div className="mt-1 text-sm">
            <span className={
              test.flag === 'normal' ? 'text-medical-green' :
              test.flag === 'borderline' ? 'text-medical-yellow' :
              'text-medical-red'
            }>
              {getFlagDescription(test.flag, test.value, test.referenceRangeNumeric)}
            </span>
          </div>
        </div>

        {/* Explanation Toggle */}
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center space-x-1 text-ahs-blue hover:text-ahs-light-blue transition-colors p-2 hover:bg-blue-50 rounded"
          aria-label={`${showExplanation ? 'Hide' : 'Show'} explanation for ${test.name}`}
        >
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showExplanation ? 'Hide' : 'Info'}
          </span>
        </button>
      </div>

      {/* Explanation Panel */}
      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-ahs-blue animate-slide-up">
          <h6 className="font-medium text-ahs-blue mb-2">What this test measures:</h6>
          <p className="text-sm text-gray-700 leading-relaxed">
            {test.explanation || 'No explanation available for this test.'}
          </p>

          {/* Additional context for abnormal results */}
          {test.flag !== 'normal' && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h6 className="font-medium text-gray-800 mb-1">Your Result Context:</h6>
              <p className="text-sm text-gray-600">
                {test.flag === 'borderline' && 
                  'This result is slightly outside the normal range but may not be clinically significant. Your healthcare provider can provide context based on your individual health status.'
                }
                {test.flag === 'abnormal' && 
                  'This result is outside the normal range and may indicate a health condition that requires attention. Please discuss this result with your healthcare provider.'
                }
                {test.flag === 'critical' && 
                  'This result is significantly abnormal and may require immediate medical attention. Contact your healthcare provider promptly to discuss this result.'
                }
              </p>
            </div>
          )}

          {/* Normal range visualization (if applicable) */}
          {test.referenceRangeNumeric && (
            <div className="mt-3">
              <h6 className="font-medium text-gray-800 mb-2">Range Visualization:</h6>
              <div className="relative">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  {/* Normal range indicator */}
                  <div className="absolute h-2 bg-medical-green rounded-full opacity-30"
                       style={{
                         left: '20%',
                         width: '60%'
                       }}>
                  </div>
                  
                  {/* Value indicator */}
                  <div className={`absolute w-3 h-3 rounded-full -mt-0.5 ${
                    test.flag === 'normal' ? 'bg-medical-green' :
                    test.flag === 'borderline' ? 'bg-medical-yellow' :
                    'bg-medical-red'
                  }`}
                       style={{
                         left: test.value < test.referenceRangeNumeric.min ? '10%' :
                               test.value > test.referenceRangeNumeric.max ? '90%' :
                               '50%'
                       }}>
                  </div>
                </div>
                
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Low</span>
                  <span>Normal Range</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TestResult 