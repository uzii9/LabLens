import React from 'react'
import { Activity, Shield } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-ahs-blue rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ahs-blue">
                Alberta Health Services
              </h1>
              <p className="text-sm text-gray-600">Lab Report Analyzer</p>
            </div>
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-medical-green" />
            <span className="hidden sm:inline">Privacy Protected</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 