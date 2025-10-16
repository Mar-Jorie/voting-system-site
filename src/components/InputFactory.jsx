// InputFactory Component - MANDATORY PATTERN
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FileUpload from './FileUpload';

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
    } else if (type === 'file') {
      // File handling is now done by the FileUpload component
      return;
    }
    // CRITICAL: Never create objects for password fields - causes [object] [object] display
    // DO NOT: newValue = { ...value, value: newValue };
    
    onChange(newValue);
  };

  const handleClear = () => {
    if (type === 'Boolean') {
      onChange(false);
    } else if (type === 'Number') {
      onChange('');
    } else if (type === 'Array') {
      onChange('');
    } else {
      onChange('');
    }
  };

  const inputId = `field-${fieldName}`;
  
  // Filter out file-specific props that shouldn't be passed to DOM elements
  const { 
    multiple, 
    maxFiles, 
    maxSize, 
    accept, 
    showPreview, 
    previewSize, 
    ...domSafeProps 
  } = otherProps;
  
  const commonProps = {
    id: inputId,
    name: fieldName,
    ...(type !== 'file' && { value: value || '' }),
    onChange: handleChange,
    className: `w-full h-10 px-3 border border-gray-300 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`,
    placeholder: placeholder || `Enter ${label || fieldName}`,
    required: required,
    ...domSafeProps
  };

  // Check if input has value and should show clear button
  const hasValue = () => {
    if (type === 'Boolean') {
      return value === true;
    } else if (type === 'Number') {
      return value !== '' && value !== null && value !== undefined;
    } else if (type === 'Array') {
      return value && value.trim() !== '';
    } else {
      return value && value.toString().trim() !== '';
    }
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
                className={`${commonProps.className} ${showPasswordToggle ? 'pr-10' : ''} ${hasValue() ? 'pr-20' : ''}`}
              />
              {hasValue() && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
              {showPasswordToggle && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${hasValue() ? 'right-10' : 'right-3'}`}
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
        return (
          <div className="relative">
            <input 
              {...commonProps} 
              type="text" 
              className={`${commonProps.className} ${hasValue() ? 'pr-10' : ''}`}
            />
            {hasValue() && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      
      case 'Number':
        return (
          <div className="relative">
            <input 
              {...commonProps} 
              type="number" 
              className={`${commonProps.className} ${hasValue() ? 'pr-10' : ''}`}
            />
            {hasValue() && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      
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
        return (
          <div className="relative">
            <input 
              {...commonProps} 
              type="date" 
              className={`${commonProps.className} ${hasValue() ? 'pr-10' : ''}`}
            />
            {hasValue() && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      
      case 'Array':
        return (
          <div className="relative">
            <textarea
              {...commonProps}
              rows={3}
              className={`${commonProps.className} resize-none ${hasValue() ? 'pr-10' : ''}`}
              placeholder={placeholder || `Enter ${label || fieldName} (one per line)`}
            />
            {hasValue() && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
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
              className={`${commonProps.className} pl-7 ${hasValue() ? 'pr-10' : ''}`}
            />
            {hasValue() && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      
      case 'file':
        return (
          <FileUpload
            label={label}
            placeholder={placeholder || `Upload ${label || fieldName}`}
            accept={config.accept || 'image/*'}
            multiple={config.multiple || false}
            maxFiles={config.maxFiles || 10}
            maxSize={config.maxSize || 5 * 1024 * 1024}
            value={value}
            onChange={onChange}
            onError={(error) => {
              // File upload error handled silently
            }}
            required={required}
            disabled={config.disabled || false}
            showPreview={config.showPreview !== false}
            previewSize={config.previewSize || 'w-20 h-20'}
            showLabel={false} // InputFactory handles the label
          />
        );
      
      default:
        return (
          <div className="relative">
            <input 
              {...commonProps} 
              type="text" 
              className={`${commonProps.className} ${hasValue() ? 'pr-10' : ''}`}
            />
            {hasValue() && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        );
    }
  };

  // For Boolean type, don't show the label twice
  if (type === 'Boolean') {
    return renderInput();
  }

  return (
    <div>
      {/* Show label for all inputs including file inputs */}
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label || fieldName}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}
