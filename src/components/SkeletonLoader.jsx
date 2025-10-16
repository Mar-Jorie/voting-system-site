// SkeletonLoader.jsx - Skeleton loading components for better UX
import React from 'react';

// Generic skeleton component
export const Skeleton = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  rounded = 'md',
  animate = true 
}) => {
  return (
    <div
      className={`bg-gray-200 ${animate ? 'animate-pulse' : ''} ${rounded ? `rounded-${rounded}` : ''} ${className}`}
      style={{ width, height }}
    />
  );
};

// Card skeleton
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="60%" height="1.5rem" />
        <Skeleton width="3rem" height="3rem" rounded="lg" />
      </div>
      <Skeleton width="100%" height="2rem" className="mb-2" />
      <Skeleton width="80%" height="1rem" className="mb-4" />
      <div className="flex space-x-2">
        <Skeleton width="4rem" height="2rem" rounded="md" />
        <Skeleton width="4rem" height="2rem" rounded="md" />
      </div>
    </div>
  );
};

// Metric card skeleton
export const MetricCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg p-5 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton width="2.5rem" height="2.5rem" rounded="lg" />
        <Skeleton width="3rem" height="1.25rem" rounded="full" />
      </div>
      <Skeleton width="4rem" height="2rem" className="mb-1" />
      <Skeleton width="8rem" height="1rem" className="mb-2" />
      <div className="flex items-center justify-between">
        <Skeleton width="6rem" height="0.75rem" />
        <Skeleton width="2rem" height="0.75rem" />
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
      {/* Table header */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} width="8rem" height="1rem" />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} width="6rem" height="1rem" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Candidate card skeleton
export const CandidateCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`border-2 border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Image skeleton */}
      <div className="relative h-56 bg-gray-200 animate-pulse">
        <div className="absolute top-3 left-3">
          <Skeleton width="1.25rem" height="1.25rem" rounded="md" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-5">
        <div className="text-center">
          <Skeleton width="8rem" height="1.5rem" className="mx-auto mb-2" />
          <Skeleton width="100%" height="1rem" className="mb-1" />
          <Skeleton width="80%" height="1rem" className="mb-3" />
          
          {/* Vote badge skeleton */}
          <Skeleton width="5rem" height="1.5rem" rounded="full" className="mx-auto mb-4" />
        </div>
        
        {/* Action buttons skeleton */}
        <div className="flex space-x-2">
          <Skeleton width="100%" height="2rem" rounded="md" />
          <Skeleton width="100%" height="2rem" rounded="md" />
        </div>
      </div>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="mb-8">
        <Skeleton width="12rem" height="2rem" className="mb-2" />
        <Skeleton width="20rem" height="1rem" />
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 3xl:grid-cols-6 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>

      {/* Control panels skeleton */}
      <div className="space-y-4">
        <Skeleton width="8rem" height="1.5rem" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>

      {/* Winners skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Results skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Activity skeleton */}
      <CardSkeleton />
    </div>
  );
};

// Candidates page skeleton
export const CandidatesPageSkeleton = () => {
  return (
    <div>
      {/* Page header skeleton */}
      <div className="mb-4">
        <Skeleton width="12rem" height="2rem" className="mb-2" />
        <Skeleton width="20rem" height="1rem" />
      </div>

      {/* Search filter skeleton */}
      <div className="mb-4">
        <Skeleton width="100%" height="2.5rem" rounded="md" />
      </div>

      {/* Selection header skeleton */}
      <div className="mb-4 p-3">
        <Skeleton width="8rem" height="1rem" />
      </div>

      {/* Male candidates skeleton */}
      <div className="p-4">
        <Skeleton width="8rem" height="1.5rem" className="mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <CandidateCardSkeleton key={index} />
          ))}
        </div>
      </div>

      {/* Female candidates skeleton */}
      <div className="p-4">
        <Skeleton width="10rem" height="1.5rem" className="mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <CandidateCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading spinner with text
export const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary-600`} />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

// Progressive loading wrapper
export const ProgressiveLoader = ({ 
  children, 
  loading, 
  skeleton: SkeletonComponent,
  error,
  onRetry,
  className = ''
}) => {
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return SkeletonComponent ? <SkeletonComponent /> : <LoadingSpinner text="Loading..." />;
  }

  return children;
};

// Landing page skeleton
export const LandingPageSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Live Results Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <Skeleton width="16rem" height="2rem" className="mx-auto mb-4" />
          <Skeleton width="24rem" height="1rem" className="mx-auto" />
        </div>

        {/* Winners Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Male Winner Skeleton */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 shadow-sm border border-primary-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="12rem" height="1.5rem" />
              <Skeleton width="2.5rem" height="2.5rem" rounded="lg" />
            </div>
            <div className="text-center">
              <Skeleton width="5rem" height="5rem" rounded="full" className="mx-auto mb-4" />
              <Skeleton width="8rem" height="1.5rem" className="mx-auto mb-2" />
              <Skeleton width="6rem" height="2rem" className="mx-auto mb-2" />
              <Skeleton width="7rem" height="1rem" className="mx-auto" />
            </div>
          </div>

          {/* Female Winner Skeleton */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 shadow-sm border border-primary-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="12rem" height="1.5rem" />
              <Skeleton width="2.5rem" height="2.5rem" rounded="lg" />
            </div>
            <div className="text-center">
              <Skeleton width="5rem" height="5rem" rounded="full" className="mx-auto mb-4" />
              <Skeleton width="8rem" height="1.5rem" className="mx-auto mb-2" />
              <Skeleton width="6rem" height="2rem" className="mx-auto mb-2" />
              <Skeleton width="7rem" height="1rem" className="mx-auto" />
            </div>
          </div>
        </div>

        {/* Voting Status Skeleton */}
        <div className="text-center">
          <Skeleton width="10rem" height="1.5rem" className="mx-auto mb-2" />
          <Skeleton width="8rem" height="1rem" className="mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
