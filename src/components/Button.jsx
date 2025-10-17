// Button Component - MANDATORY PATTERN
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14'
  };

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md',
    primaryOutline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 bg-transparent',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 shadow-sm hover:shadow-md',
    secondaryOutline: 'border border-gray-600 text-gray-600 hover:bg-gray-50 bg-transparent',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md',
    warning: 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow-md',
    info: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
    ghost: 'text-gray-700 hover:bg-gray-100 bg-transparent',
    link: 'text-primary-600 hover:text-primary-700 underline bg-transparent p-0 h-auto',
    light: 'bg-white text-primary-600 hover:bg-gray-50 shadow-sm hover:shadow-md'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
