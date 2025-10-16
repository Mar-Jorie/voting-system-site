// Pagination Component - MANDATORY PATTERN
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0
}) => {
  // Always show pagination if there are items, even for single page
  if (totalItems === 0) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="inline-flex items-center p-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      
      {/* Current page info */}
      <span className="text-sm font-medium text-gray-700">
        {currentPage} of {totalPages}
      </span>
      
      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="inline-flex items-center p-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
