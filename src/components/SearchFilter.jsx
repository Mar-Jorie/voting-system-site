// SearchFilter Component - MANDATORY PATTERN
import { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SelectInput from './SelectInput';

const SearchFilter = ({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
  onFilterChange,
  filters = {},
  useSelectForSearch = false,
  searchSelectOptions = [],
  searchSelectValue,
  onSearchSelectChange,
  statusOptions = [],
  getUniqueCompanies = () => [],
  additionalFilters = [],
  className = "bg-gray-50 border-gray-200",
  showFilterIcon = true
}) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const toggleFilterPanel = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const handleSearchChange = (e) => {
    onChange(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch && onSearch(value);
  };

  const handleFilterChange = (filterKey, filterValue) => {
    onFilterChange && onFilterChange(filterKey, filterValue);
  };

  const clearFilters = () => {
    // Clear all filters
    Object.keys(filters).forEach(key => {
      handleFilterChange(key, '');
    });
    setIsFilterPanelOpen(false);
  };

  const companyOptions = getUniqueCompanies().map(company => ({
    value: company,
    label: company
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Filter Row */}
      <div className="flex items-center gap-2 sm:gap-1">
        {/* Primary Filter - Search Input or Select Input */}
        <div className="flex-1 min-w-0">
          {useSelectForSearch ? (
            <SelectInput
              label=""
              value={searchSelectValue}
              onChange={onSearchSelectChange}
              options={searchSelectOptions}
              placeholder={placeholder}
              className={className}
            />
          ) : (
            <form onSubmit={handleSearch} className="w-full">
              <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleSearchChange}
                className={`w-full h-10 px-3 border rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
              />
            </form>
          )}
        </div>

        {/* Filter Icon - Only show if showFilterIcon is true */}
        {showFilterIcon && (
          <button
            onClick={toggleFilterPanel}
            className="p-2 sm:p-2 text-gray-600 hover:text-primary-600 transition-colors flex-shrink-0"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Panel Overlay - Only show if showFilterIcon is true */}
      {showFilterIcon && isFilterPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/30 bg-opacity-50 z-[125] h-screen"
          onClick={toggleFilterPanel}
        ></div>
      )}

      {/* Right Side Filter Panel - Only show if showFilterIcon is true */}
      {showFilterIcon && (
        <div className={`
          fixed top-0 right-0 h-screen w-80 sm:w-72 bg-white shadow-lg z-[130] transform transition-transform duration-300 ease-in-out filter-panel-fixed
          ${isFilterPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
        <div className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Filters</h3>
              <button
                onClick={toggleFilterPanel}
                className="p-2 rounded transition-colors hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Status Filter */}
            {statusOptions.length > 0 && (
              <SelectInput
                label="Status"
                value={statusOptions.find(option => option.value === filters.status) || null}
                onChange={(option) => handleFilterChange('status', option?.value || '')}
                options={statusOptions}
                className="filter-select-input"
              />
            )}

            {/* Company Filter */}
            {companyOptions.length > 0 && (
              <SelectInput
                label="Company"
                value={companyOptions.find(option => option.value === filters.company) || null}
                onChange={(option) => handleFilterChange('company', option?.value || '')}
                options={companyOptions}
                className="filter-select-input"
              />
            )}

            {/* Date Range Filter */}
            {filters.dateRange !== undefined && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange.start || ''}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end || ''}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Additional Filters */}
            {additionalFilters && additionalFilters.map((filter, index) => (
              <SelectInput
                key={index}
                label={filter.label}
                value={filter.options.find(option => option.value === filters[filter.key]) || null}
                onChange={(option) => handleFilterChange(filter.key, option?.value || '')}
                options={filter.options}
                className="filter-select-input"
              />
            ))}
          </div>

          {/* Filter Actions */}
          <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={clearFilters}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
