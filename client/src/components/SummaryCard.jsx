import React from 'react'

const SummaryCard = ({ title, value, color, critical = false }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'red':
        return critical 
          ? 'bg-red-100 border-red-300 text-red-900 animate-pulse'
          : 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getValueColorClass = () => {
    switch (color) {
      case 'blue':
        return 'text-ahs-blue'
      case 'green':
        return 'text-medical-green'
      case 'yellow':
        return 'text-medical-yellow'
      case 'red':
        return critical ? 'text-red-700' : 'text-medical-red'
      default:
        return 'text-gray-700'
    }
  }

  return (
    <div className={`p-4 rounded-lg border ${getColorClasses()}`}>
      <div className="text-center">
        <div className={`text-2xl font-bold ${getValueColorClass()}`}>
          {value}
        </div>
        <div className="text-sm font-medium mt-1">
          {title}
        </div>
        {critical && value > 0 && (
          <div className="text-xs mt-1 font-medium">
            Requires Attention
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryCard