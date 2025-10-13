// Calendar Component - MANDATORY PATTERN
import { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Button from './Button';

const Calendar = ({ 
  mode = 'single', // 'single', 'range', 'datetime'
  value = null,
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value);
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  const calendarRef = useRef(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate days for current month
  const generateDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const daysInMonth = generateDaysInMonth();

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const handleDateClick = (date) => {
    if (mode === 'single') {
      setSelectedDate(date);
      onChange && onChange(date);
      setIsOpen(false);
    } else if (mode === 'range') {
      if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
        setSelectedRange({ start: date, end: null });
      } else {
        const start = selectedRange.start;
        const end = date;
        if (start > end) {
          setSelectedRange({ start: end, end: start });
        } else {
          setSelectedRange({ start, end });
        }
        onChange && onChange({ start, end });
        setIsOpen(false);
      }
    }
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange && onChange(dateTime);
    }
  };

  const getDisplayValue = () => {
    if (mode === 'single') {
      return selectedDate ? selectedDate.toLocaleDateString() : placeholder;
    } else if (mode === 'range') {
      if (selectedRange.start && selectedRange.end) {
        return `${selectedRange.start.toLocaleDateString()} - ${selectedRange.end.toLocaleDateString()}`;
      } else if (selectedRange.start) {
        return `${selectedRange.start.toLocaleDateString()} - ...`;
      }
      return placeholder;
    } else if (mode === 'datetime') {
      return selectedDate ? selectedDate.toLocaleString() : placeholder;
    }
    return placeholder;
  };

  const isSelected = (date) => {
    if (mode === 'single') {
      return selectedDate && date.toDateString() === selectedDate.toDateString();
    } else if (mode === 'range') {
      if (!selectedRange.start) return false;
      if (selectedRange.end) {
        return date >= selectedRange.start && date <= selectedRange.end;
      }
      return date.toDateString() === selectedRange.start.toDateString();
    }
    return false;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedRange({ start: null, end: null });
    onChange && onChange(null);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {/* Calendar Input Field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left text-sm border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-colors duration-200
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-900 hover:border-gray-400 cursor-pointer'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate || selectedRange.start ? 'text-gray-900' : 'text-gray-500'}>
            {getDisplayValue()}
          </span>
          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header with Month Navigation */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              {/* Month and Year Selection */}
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-gray-900">
                  {months[currentMonth.getMonth()]}
                </span>
                <div className="relative">
                  <button 
                    onClick={() => setShowYearDropdown(!showYearDropdown)}
                    className="flex items-center space-x-1 text-base font-semibold text-gray-900 hover:text-primary-600"
                  >
                    <span>{currentMonth.getFullYear()}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Year Dropdown */}
                  {showYearDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = currentMonth.getFullYear() - 5 + i;
                        return (
                          <button
                            key={year}
                            onClick={() => {
                              setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
                              setShowYearDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => navigateMonth(1)}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {days.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-8"></div>;
                }
                
                const isSelectedDate = isSelected(date);
                const isTodayDate = isToday(date);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`
                      h-8 w-8 text-sm rounded-md transition-colors duration-200 flex items-center justify-center
                      ${isSelectedDate ? 'bg-primary-600 text-white font-semibold' : 
                        isTodayDate ? 'bg-gray-100 text-gray-900 font-semibold' :
                        'text-gray-700 hover:bg-gray-100 font-medium'}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selection (for datetime mode) */}
          {mode === 'datetime' && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Time:</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button variant="secondaryOutline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {mode === 'range' && selectedRange.start && !selectedRange.end && (
              <Button variant="primary" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
