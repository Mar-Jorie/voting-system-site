// ConfirmationModal Component - MANDATORY PATTERN
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  icon,
  variant = 'danger',
  showCancelButton = true,
  loading = false
}) => {
  if (!isOpen) return null;

  const getIconStyles = () => {
    switch (variant) {
      case 'danger':
        return { iconColor: 'text-red-600', iconBgColor: 'bg-red-100' };
      case 'warning':
        return { iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' };
      case 'info':
        return { iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' };
      case 'success':
        return { iconColor: 'text-green-600', iconBgColor: 'bg-green-100' };
      default:
        return { iconColor: 'text-red-600', iconBgColor: 'bg-red-100' };
    }
  };

  const { iconColor, iconBgColor } = getIconStyles();

  const getButtonVariants = () => {
    switch (variant) {
      case 'danger':
        return { confirm: 'danger', cancel: 'primaryOutline' };
      case 'warning':
        return { confirm: 'warning', cancel: 'primaryOutline' };
      case 'info':
        return { confirm: 'info', cancel: 'primaryOutline' };
      case 'success':
        return { confirm: 'success', cancel: 'primaryOutline' };
      default:
        return { confirm: 'danger', cancel: 'primaryOutline' };
    }
  };

  const { confirm: confirmVariant, cancel: cancelVariant } = getButtonVariants();

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={onClose}></div>
        
        {/* Modal Content */}
        <div className="relative z-50 w-full max-w-lg p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Icon */}
              <div className={`w-10 h-10 ${iconBgColor} rounded-full flex items-center justify-center`}>
                <svg
                  className={`w-6 h-6 ${iconColor}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={icon}
                  />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className={`flex ${showCancelButton ? 'flex-row gap-3' : 'justify-center'}`}>
            {showCancelButton && (
              <Button
                variant={cancelVariant}
                size="md"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              variant={confirmVariant}
              size="md"
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
              className={showCancelButton ? "flex-1" : "w-full min-w-[120px]"}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
