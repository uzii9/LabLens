import React from 'react'
import { Activity } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Spinner Animation */}
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-ahs-blue rounded-full animate-spin"></div>
        </div>
        
        {/* Inner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-6 h-6 text-ahs-blue animate-pulse" />
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-ahs-blue rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-ahs-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-ahs-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  )
}

export default LoadingSpinner 