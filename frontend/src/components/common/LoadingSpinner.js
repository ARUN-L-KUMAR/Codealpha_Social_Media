import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'blue', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white',
    red: 'border-red-600',
    green: 'border-green-600',
    gradient: 'border-blue-500'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300/30 ${colorClasses[color]} ${sizeClasses[size]}`}
        style={{ borderTopColor: 'transparent' }}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

// Enhanced Page Loading Component
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      {/* Animated Logo/Icon */}
      <div className="relative mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
          <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v8.5l-2 2v-4l-2-2V7a1 1 0 00-1-1H9a1 1 0 00-1 1v1.5l-2 2v4l-2-2V4a1 1 0 011-1h2z" />
          </svg>
        </div>
        {/* Pulsing rings */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-400/30 rounded-2xl animate-ping"></div>
        <div className="absolute inset-2 w-12 h-12 border-2 border-purple-400/20 rounded-xl animate-ping delay-150"></div>
      </div>

      {/* Enhanced Spinner */}
      <div className="relative mb-6">
        <div className="w-12 h-12 border-4 border-gray-200/30 dark:border-gray-700/30 rounded-full animate-spin">
          <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"></div>
        </div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-pink-500 border-l-blue-400 rounded-full animate-spin delay-150" style={{ animation: 'reverse-spin 2s linear infinite' }}></div>
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          {message}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Please wait while we load your content...
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></div>
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
      </div>

      <style>{`
        @keyframes reverse-spin {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};

// Inline Loading Component
export const InlineLoader = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div className={`w-8 h-8 border-2 border-gray-200/30 dark:border-gray-700/30 rounded-full animate-spin`}>
          <div className="w-full h-full border-2 border-transparent border-t-blue-500 rounded-full"></div>
        </div>
      </div>
      <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">{message}</span>
    </div>
  );
};

// Button Loading Component
export const ButtonLoader = ({ size = 'small' }) => {
  return (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
  );
};

// Enhanced Card Loading Skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 mb-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-1/4 mb-2"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-1/6 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-5/6"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced User Card Loading Skeleton
export const UserCardSkeleton = () => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full"></div>
          <div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-24 mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-16"></div>
          </div>
        </div>
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full w-20"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;