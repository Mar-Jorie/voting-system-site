// InputFactory Component - MANDATORY PATTERN
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function InputFactory({ fieldName, config, value, onChange, className = '' }) {
  const {
    type = 'String',
    label,
    placeholder,
    required = false,
    format,
    showPasswordToggle = false,
    ...otherProps
  } = config;

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    if (type === 'Number') {
      newValue = newValue === '' ? '' : parseFloat(newValue);
      if (isNaN(newValue)) return;
    } else if (type === 'Boolean') {
      newValue = e.target.checked;
    }
    // CRITICAL: Never create objects for password fields - causes [object] [object] display
    // DO NOT: newValue = { ...value, value: newValue };
    
    onChange(newValue);
  };

  const inputId = `field-${fieldName}`;
  const commonProps = {
    id: inputId,
    name: fieldName,
    value: value || '',
    onChange: handleChange,
    className: `w-full h-10 px-3 border border-gray-300 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`,
    placeholder: placeholder || `Enter ${label || fieldName}`,
    required: required,
    ...otherProps
  };

  const renderInput = () => {
    switch (type) {
      case 'String':
        if (format === 'password') {
          return (
            <div className="relative">
              <input
                {...commonProps}
                type={showPassword ? 'text' : 'password'}
                className={`${commonProps.className} ${showPasswordToggle ? 'pr-10' : ''}`}
              />
              {showPasswordToggle && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          );
        }
        return <input {...commonProps} type="text" />;
      
      case 'Number':
        return <input {...commonProps} type="number" />;
      
      case 'Boolean':
        return (
          <div className="flex items-center">
            <input
              {...commonProps}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor={inputId} className="ml-2 block text-sm text-gray-700">
              {label || fieldName}
            </label>
          </div>
        );
      
      case 'Date':
        return <input {...commonProps} type="date" />;
      
      case 'Array':
        return (
          <textarea
            {...commonProps}
            rows={3}
            className={`${commonProps.className} resize-none`}
            placeholder={placeholder || `Enter ${label || fieldName} (one per line)`}
          />
        );
      
      case 'Currency':
        // For Currency type, we'll use a simple number input with currency formatting
        return (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              {...commonProps}
              type="number"
              step="0.01"
              className={`${commonProps.className} pl-7`}
            />
          </div>
        );
      
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  // For Boolean type, don't show the label twice
  if (type === 'Boolean') {
    return renderInput();
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label || fieldName}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}
