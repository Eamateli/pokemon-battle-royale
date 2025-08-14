import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Connection Status Component
 * Shows the current WebSocket connection status
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Connection status ('connected', 'connecting', 'disconnected')
 * @param {boolean} props.showIcon - Whether to show the connection icon
 * @param {string} props.className - Additional CSS classes
 */
function ConnectionStatus({ status, showIcon = true, className = "" }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Live updates active',
          textColor: 'text-green-600',
          icon: Wifi
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: 'Connecting...',
          textColor: 'text-yellow-600',
          icon: Wifi
        };
      case 'disconnected':
      default:
        return {
          color: 'bg-red-500',
          text: 'Disconnected',
          textColor: 'text-red-600',
          icon: WifiOff
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {showIcon && <Icon className={`w-4 h-4 ${config.textColor}`} />}
      
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      
      <span className="text-gray-600">
        {config.text}
      </span>
      
      {status === 'connected' && (
        <span className="text-xs text-gray-500">
          • Real-time
        </span>
      )}
    </div>
  );
}

export default ConnectionStatus;