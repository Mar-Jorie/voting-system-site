import { ArrowPathIcon } from '@heroicons/react/24/outline';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text = null,
  className = '',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  };

  const spinnerElement = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <ArrowPathIcon 
          className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
          aria-hidden="true"
        />
        {text && (
          <p className={`text-sm ${colorClasses[color]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;
