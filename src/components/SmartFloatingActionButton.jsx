// SmartFloatingActionButton Component - MANDATORY PATTERN
import { useState } from 'react';
import { 
  PlusIcon, 
  EllipsisVerticalIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  CheckCircleIcon,
  PlayIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

const SmartFloatingActionButton = ({ 
  variant = 'single', // 'single' or 'dots'
  icon = 'PlusIcon',
  label = 'Add new item',
  action,
  selectedCount = 0,
  bulkActions = [],
  quickActions = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Icon component resolution
  const getIconComponent = (iconName) => {
    const iconMap = {
      PlusIcon,
      EllipsisVerticalIcon,
      ArrowUpTrayIcon,
      ArrowDownTrayIcon,
      TrashIcon,
      CalendarDaysIcon,
      UserPlusIcon,
      CheckCircleIcon,
      PlayIcon,
      EyeIcon,
      PencilIcon,
      DocumentArrowDownIcon,
      DocumentArrowUpIcon
    };
    return iconMap[iconName] || EllipsisVerticalIcon;
  };

  const IconComponent = getIconComponent(icon);

  // Determine current variant and actions based on selection state
  const currentVariant = selectedCount > 0 ? 'dots' : variant;
  const currentActions = selectedCount > 0 ? bulkActions : quickActions;
  const currentLabel = selectedCount > 0 ? 'Toggle bulk actions' : label;

  const handleMainButtonClick = () => {
    if (currentVariant === 'single') {
      action && action();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      {/* Expanded Floating Buttons - Viewport fixed positioning */}
      {currentVariant === 'dots' && isExpanded && (
        <div className="fixed bottom-24 right-6 z-[80] flex flex-col items-end space-y-3">
          {currentActions.map((action, index) => (
            <div 
              key={action.name}
              className="flex items-center space-x-3"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'slideInFromBottom 0.3s ease-out forwards'
              }}
            >
              {/* Action Label */}
              <div className="bg-white px-2 py-1 rounded-lg shadow-card border border-gray-200">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  {action.name}
                </span>
              </div>
              
              {/* Action Button - MUST use proper icon component resolution */}
              <button
                onClick={action.action}
                className={`w-12 h-12 ${action.color} text-white rounded-full shadow-card flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-card-hover`}
                aria-label={action.name}
              >
                {action.icon && (() => {
                  const ActionIconComponent = getIconComponent(action.icon);
                  return <ActionIconComponent className="h-5 w-5" />;
                })()}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB Button - Fixed to viewport bottom-right */}
      <button
        onClick={handleMainButtonClick}
        className={`fixed bottom-6 right-6 z-[80] w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-card flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-card-hover ${
          currentVariant === 'dots' && isExpanded ? 'rotate-90' : ''
        }`}
        aria-label={currentLabel}
      >
        <IconComponent className="h-5 w-5" />
      </button>
    </>
  );
};

export default SmartFloatingActionButton;
