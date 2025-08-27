import React from 'react'
import { Activity, Shield, Award } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/50 border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {/* Logo with enhanced styling */}
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-ahs-blue to-ahs-light-blue rounded-xl shadow-lg shadow-ahs-blue/20">
                <Activity className="w-7 h-7 text-white" />
              </div>
              {/* Professional badge indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-medical-green rounded-full border-2 border-white shadow-sm">
                <Award className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-ahs-blue tracking-tight">
                LabLens
              </h1>
              <p className="text-sm md:text-base text-gray-600 font-medium">
                AHS Lab Report Analyzer
              </p>
            </div>
          </div>

          {/* Enhanced Privacy & Trust Indicators */}
          <div className="flex items-center space-x-6">
            {/* Privacy Badge */}
            <div className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2.5 rounded-xl border border-green-100">
              <Shield className="w-5 h-5 text-medical-green" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">Privacy Protected</span>
                <span className="text-xs text-gray-600">HIA Compliant</span>
              </div>
            </div>
            
            {/* Mobile Privacy Indicator */}
            <div className="sm:hidden flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
              <Shield className="w-4 h-4 text-medical-green" />
              <span className="text-sm font-medium text-gray-700">Secure</span>
            </div>
            
            {/* Professional Status Indicator */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-medical-green rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Live System</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 