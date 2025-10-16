// CurrencyInput Component - MANDATORY PATTERN
import { useState } from 'react';

const CurrencyInput = ({ 
  value = { amount: '', currency: 'USD' }, 
  onChange, 
  label, 
  placeholder = 'Enter amount',
  required = false,
  disabled = false,
  className = '',
  error = null,
  showLabel = true
}) => {
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
  ];

  const selectedCurrency = currencies.find(c => c.code === value.currency) || currencies[0];

  const handleAmountChange = (e) => {
    let amount = e.target.value;
    
    // Remove any non-numeric characters except decimal point and commas
    amount = amount.replace(/[^0-9.,]/g, '');
    
    // Remove existing commas and format with new commas
    const numericValue = amount.replace(/,/g, '');
    
    // Format with commas for thousands separator
    if (numericValue && !isNaN(numericValue)) {
      const parts = numericValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      amount = parts.join('.');
    }
    
    onChange({
      amount,
      currency: value.currency
    });
  };

  const handleAmountBlur = (e) => {
    let amount = e.target.value;
    
    // Remove any non-numeric characters except decimal point and commas
    amount = amount.replace(/[^0-9.,]/g, '');
    
    // Remove existing commas and format with new commas
    const numericValue = amount.replace(/,/g, '');
    
    // Format with commas for thousands separator
    if (numericValue && !isNaN(numericValue)) {
      const parts = numericValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      amount = parts.join('.');
    }
    
    onChange({
      amount,
      currency: value.currency
    });
  };

  const handleCurrencyChange = (currencyCode) => {
    onChange({
      amount: value.amount,
      currency: currencyCode
    });
    setIsCurrencyOpen(false);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="flex">
          {/* Currency Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && setIsCurrencyOpen(!isCurrencyOpen)}
              disabled={disabled}
              className={`
                flex items-center justify-center px-3 py-2 border border-r-0 rounded-l-md
                transition-colors duration-200 min-w-[50px] h-10
                ${disabled 
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-300' 
                  : 'bg-white text-gray-900 hover:bg-gray-50 cursor-pointer'
                }
                ${isFocused && !disabled
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : error 
                    ? 'border-red-300' 
                    : 'border-gray-300'
                }
              `}
            >
              <span className="text-sm text-gray-600">{selectedCurrency.symbol}</span>
            </button>

            {/* Currency Dropdown */}
            {isCurrencyOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]">
                <div className="py-1">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency.code)}
                      className={`
                        w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors
                        flex items-center justify-between
                        ${currency.code === value.currency ? 'bg-primary-50 text-primary-700' : 'text-gray-900'}
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{currency.symbol}</span>
                        <span>{currency.code}</span>
                      </div>
                      <span className="text-xs text-gray-500">{currency.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <input
            type="text"
            value={value.amount}
            onChange={handleAmountChange}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              handleAmountBlur(e);
            }}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`
              flex-1 px-3 py-2 border rounded-r-md text-sm
              focus:outline-none transition-colors duration-200 h-10
              ${disabled 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-300' 
                : 'bg-white text-gray-900'
              }
              ${isFocused && !disabled
                ? 'border-primary-500 ring-2 ring-primary-500'
                : error 
                  ? 'border-red-300' 
                  : 'border-gray-300'
              }
            `}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CurrencyInput;
