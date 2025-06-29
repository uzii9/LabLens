import React from 'react'
import { AlertCircle, X } from 'lucide-react'

const ErrorMessage = ({ message, onDismiss, type = 'error' }) => {
  const getTypeClasses = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700'
        }
      case 'error':
      default:
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700'
        }
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'warning':
        return 'Warning'
      case 'info':
        return 'Information'
      case 'error':
      default:
        return 'Error'
    }
  }

  const classes = getTypeClasses()

  return (
    <div className={`p-4 rounded-lg border ${classes.container}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className={`w-5 h-5 ${classes.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${classes.title}`}>
            {getTitle()}
          </h3>
          <div className={`mt-1 text-sm ${classes.message}`}>
            <p>{message}</p>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'error' 
                    ? 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                    : type === 'warning'
                    ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600'
                    : 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
                aria-label="Dismiss"
              >
                <span className="sr-only">Dismiss</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage 