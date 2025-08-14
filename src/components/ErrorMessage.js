import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Message Component
 * Displays error information with retry functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.error - Error message to display
 * @param {Function} props.onRetry - Function to call when retry button is clicked
 * @param {string} props.className - Additional CSS classes
 */
function ErrorMessage({ error, onRetry, className = "" }) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-red-400 to-pink-600 ${className}`}>
      <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Oops! Something went wrong
        </h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {error || "An unexpected error occurred while loading the Pokémon battle."}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <p className="text-xs text-gray-500">
            If the problem persists, please check your internet connection.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorMessage;