// FormModal Component - MANDATORY PATTERN
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import InputFactory from './InputFactory';
import SelectInput from './SelectInput';

const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields = [],
  initialData = {},
  loading = false,
  isUpdate = false,
  submitButtonText = null
}) => {
  // Memoize initialData to prevent infinite re-renders
  const memoizedInitialData = useMemo(() => initialData, [JSON.stringify(initialData)]);
  
  const [formData, setFormData] = useState(memoizedInitialData);
  const [errors, setErrors] = useState({});

  // Debug errors state changes
  useEffect(() => {
    console.log('FormModal errors state changed:', errors);
  }, [errors]);


  // Update form data when initialData changes
  useEffect(() => {
    setFormData(memoizedInitialData);
  }, [memoizedInitialData]);

  // Check if form has changes (for edit forms)
  const hasChanges = () => {
    if (!isUpdate) return true; // Create forms always have changes
    return fields.some(field => {
      const currentValue = formData[field.name];
      const initialValue = memoizedInitialData[field.name];
      return currentValue !== initialValue;
    });
  };

  // Check if form is valid
  const isFormValid = () => {
    // Check if all required fields are filled and valid
    const fieldsValid = fields.every(field => {
      if (field.required) {
        const value = formData[field.name];
        if (value === null || value === undefined || value === '') {
          return false;
        }
        
        // Email format validation
        if (field.format === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        }
      }
      return true;
    });
    
    // Check if there are any field-specific errors (like duplicate email)
    const noFieldErrors = Object.values(errors).every(error => error === null);
    
    return fieldsValid && noFieldErrors;
  };

  // Get validation error message
  const getValidationError = () => {
    for (const field of fields) {
      if (field.required) {
        const value = formData[field.name];
        if (value === null || value === undefined || value === '') {
          return `${field.label} is required`;
        }
        
        // Email format validation
        if (field.format === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
          }
        }
      }
    }
    return null;
  };

  const handleFieldChange = async (fieldName, value) => {
    console.log('FormModal handleFieldChange called with:', fieldName, value);
    // For select fields, extract the value from the option object
    const fieldValue = (typeof value === 'object' && value?.value !== undefined) ? value.value : value;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: null
      }));
    }

    
    // Validate email format and check for duplicates in real-time
    if (fieldName === 'email' && value && value.trim() !== '') {
      console.log('Email validation triggered for:', value);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        console.log('Email format invalid');
        setErrors(prev => ({
          ...prev,
          [fieldName]: 'Please enter a valid email address'
        }));
      } else {
        console.log('Email format valid, checking database...');
        // Check if email has already voted in database
        try {
          const apiClient = (await import('../usecases/api')).default;
          const existingVotes = await apiClient.findObjects('votes', {
            where: { voter_email: value }
          });
          console.log('Database check result:', existingVotes);
          
          if (existingVotes && existingVotes.length > 0) {
            console.log('Email already voted, setting error');
            setErrors(prev => ({
              ...prev,
              [fieldName]: 'Email already voted'
            }));
          } else {
            console.log('Email is valid, clearing error');
            setErrors(prev => ({
              ...prev,
              [fieldName]: null
            }));
          }
        } catch (error) {
          console.error('Error checking email:', error);
          // If there's an error checking, allow the user to proceed
          setErrors(prev => ({
            ...prev,
            [fieldName]: null
          }));
        }
      }
    } else if (fieldName === 'email' && (!value || value.trim() === '')) {
      console.log('Email field cleared');
      // Clear email error when field is empty
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      const validationError = getValidationError();
      setErrors({ general: validationError || 'Please fill in all required fields' });
      return;
    }

    if (!hasChanges()) {
      setErrors({ general: 'No changes made' });
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData(memoizedInitialData);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={handleClose}></div>
        
        {/* Modal Content */}
        <div className="relative z-50 w-full max-w-lg sm:max-w-xl overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl flex flex-col max-h-[90vh]">
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  {field.type === 'select' ? (
                    <SelectInput
                      label={field.label}
                      options={field.options || []}
                      value={(() => {
                        const currentValue = formData[field.name];
                        if (!currentValue) return null;
                        
                        // If it's already an object, return as is
                        if (typeof currentValue === 'object' && currentValue.value) {
                          return currentValue;
                        }
                        
                        // If it's a string, find the matching option
                        const matchingOption = field.options?.find(option => option.value === currentValue);
                        return matchingOption || null;
                      })()}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      searchable={field.searchable}
                      multiple={field.multiple}
                    />
                  ) : (
                    <InputFactory
                      fieldName={field.name}
                      config={{
                        type: field.type || 'String',
                        label: field.label,
                        placeholder: field.placeholder,
                        required: field.required,
                        format: field.format,
                        showPasswordToggle: field.showPasswordToggle,
                        // File upload specific properties
                        multiple: field.multiple,
                        maxFiles: field.maxFiles,
                        maxSize: field.maxSize,
                        accept: field.accept,
                        showPreview: field.showPreview,
                        previewSize: field.previewSize,
                        disabled: field.disabled
                      }}
                      value={formData[field.name]}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      error={errors[field.name]}
                    />
                  )}
                  
                  {/* Field-specific error message */}
                  {errors[field.name] && (
                    <p className="mt-1 text-red-600 text-sm">
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="px-6 flex-shrink-0">
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {errors.general}
                </div>
              </div>
            )}

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondaryOutline"
                  size="md"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  disabled={loading || !isFormValid() || !hasChanges()}
                  className="flex-1"
                >
                  {loading ? (
                    submitButtonText ? `${submitButtonText}...` : (isUpdate ? 'Updating...' : 'Creating...')
                  ) : (
                    submitButtonText || (isUpdate ? 'Update' : 'Create')
                  )}
                </Button>
              </div>
              
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FormModal;
