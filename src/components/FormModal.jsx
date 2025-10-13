// FormModal Component - MANDATORY PATTERN
import { useState, useEffect } from 'react';
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
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Check if form has changes (for edit forms)
  const hasChanges = () => {
    if (!isUpdate) return true; // Create forms always have changes
    return fields.some(field => {
      const currentValue = formData[field.name];
      const initialValue = initialData[field.name];
      return currentValue !== initialValue;
    });
  };

  // Check if form is valid
  const isFormValid = () => {
    return fields.every(field => {
      if (field.required) {
        const value = formData[field.name];
        return value !== null && value !== undefined && value !== '';
      }
      return true;
    });
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setErrors({ general: 'Please fill in all required fields' });
      return;
    }

    if (!hasChanges()) {
      setErrors({ general: 'No changes made' });
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData(initialData);
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
        <div className="relative z-50 w-full max-w-lg sm:max-w-xl overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  {field.type === 'select' ? (
                    <SelectInput
                      label={field.label}
                      options={field.options || []}
                      value={formData[field.name]}
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
                        showPasswordToggle: field.showPasswordToggle
                      }}
                      value={formData[field.name]}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      error={errors[field.name]}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="px-6">
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {errors.general}
                </div>
              </div>
            )}

            {/* Footer */}
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
