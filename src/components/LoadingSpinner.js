import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading Spinner Component
 * Shows a loading state with animation
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Custom loading message
 * @param {string} props.className - Additional CSS classes
 */
function LoadingSpinner({ message = "Loading Pokémon...", className = "" }) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 ${className}`}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white text-xl font-medium">{message}</p>
        <div className="mt-4 text-white/70 text-sm">
          Catching your Pokémon...
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;