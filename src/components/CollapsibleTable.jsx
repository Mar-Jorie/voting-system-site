// CollapsibleTable Component - MANDATORY PATTERN
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const CollapsibleTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  loading = false,
  pagination = true,
  itemsPerPage = 10,
  expandableContent,
  additionalActions = [],
  emptyMessage = "No data found",
  selectedRows = new Set(),
  onSelectionChange,
  enableSelection = false
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionsModal, setShowActionsModal] = useState(false);

  // Selection state
  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange && onSelectionChange(new Set());
    } else {
      const allIds = data.map((item, index) => item.id || index);
      onSelectionChange && onSelectionChange(new Set(allIds));
    }
  };

  const handleRowSelect = (e, rowId) => {
    e.stopPropagation();
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    onSelectionChange && onSelectionChange(newSelectedRows);
  };

  const toggleRowExpansion = (rowId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };


  const handleEdit = (e, item) => {
    e.stopPropagation();
    onEdit && onEdit(item);
  };

  const handleDelete = (e, item) => {
    e.stopPropagation();
    onDelete && onDelete(item);
  };

  const handleAdditionalAction = (e, action, item) => {
    e.stopPropagation();
    action.action && action.action(item);
  };

  const handleActionsModal = (e) => {
    e.stopPropagation();
    setShowActionsModal(!showActionsModal);
  };

  const closeActionsModal = () => {
    setShowActionsModal(false);
  };

  // Pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Select All Checkbox */}
              {enableSelection && (
                <th className="px-2 sm:px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
              )}
              
              {/* Data Column Headers */}
              {columns.map((column, index) => (
                <th 
                  key={column.key}
                  className={`px-2 sm:px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    index >= 2 ? 'hidden sm:table-cell' : ''
                  }`}
                >
                  {column.label}
                </th>
              ))}
              
              {/* Expand/Collapse Header */}
              <th className="px-2 sm:px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => {
              const rowId = item.id || index;
              const isExpanded = expandedRows.has(rowId);
              
              return (
                <React.Fragment key={rowId}>
                  {/* Main Row */}
                  <tr
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => toggleRowExpansion(rowId)}
                  >
                    {/* Selection Checkbox */}
                    {enableSelection && (
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-center w-12">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowId)}
                          onChange={(e) => handleRowSelect(e, rowId)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}

                    {/* Data Columns - Mobile responsive */}
                    {columns.map((column, colIndex) => (
                      <td 
                        key={column.key} 
                        className={`px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-sm text-gray-900 text-center ${
                          colIndex >= 2 ? 'hidden sm:table-cell' : ''
                        }`}
                      >
                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                      </td>
                    ))}

                    {/* Expand/Collapse Button - Right corner */}
                    <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="p-1 text-gray-400 group-hover:text-gray-600 transition-colors">
                          {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row Content */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={columns.length + (enableSelection ? 2 : 1)} className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 bg-gray-50">
                        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                          {/* Mobile: Show hidden columns */}
                          <div className="block sm:hidden space-y-3">
                            {columns.slice(2).map((column) => (
                              <div key={column.key} className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">{column.label}</span>
                                <div className="text-sm text-gray-900">
                                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Expandable Content */}
                          {expandableContent && expandableContent(item)}

                          {/* Action Buttons - Left corner inside expanded content */}
                          {(onEdit || onDelete || additionalActions.length > 0) && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              {/* Primary Actions */}
                              {onEdit && (
                                <Button
                                  variant="secondaryOutline"
                                  size="sm"
                                  onClick={(e) => handleEdit(e, item)}
                                  className="!w-auto"
                                >
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              )}
                              
                              {onDelete && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={(e) => handleDelete(e, item)}
                                  className="!w-auto"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              )}

                              {/* Additional Actions - Smart display logic */}
                              {(() => {
                                const totalDirectButtons = (onEdit ? 1 : 0) + (onDelete ? 1 : 0) + additionalActions.length;
                                const maxDirectButtons = 2;
                                const showDirectly = totalDirectButtons <= maxDirectButtons;
                                
                                if (showDirectly) {
                                  // Show all additional actions directly
                                  return additionalActions.map((action, idx) => (
                                    <Button
                                      key={idx}
                                      variant={action.variant || "secondaryOutline"}
                                      size="sm"
                                      onClick={(e) => handleAdditionalAction(e, action, item)}
                                      className="!w-auto"
                                    >
                                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                      {action.label}
                                    </Button>
                                  ));
                                } else {
                                  // Show first 2 additional actions + 3-dots for rest
                                  return (
                                    <>
                                      {additionalActions.slice(0, 2 - (onEdit ? 1 : 0) - (onDelete ? 1 : 0)).map((action, idx) => (
                                        <Button
                                          key={idx}
                                          variant={action.variant || "secondaryOutline"}
                                          size="sm"
                                          onClick={(e) => handleAdditionalAction(e, action, item)}
                                          className="!w-auto"
                                        >
                                          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                          {action.label}
                                        </Button>
                                      ))}
                                      
                                      {/* 3-dots button for remaining actions */}
                                      <div className="relative">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => handleActionsModal(e, item)}
                                          className="!w-auto"
                                        >
                                          <EllipsisVerticalIcon className="h-4 w-4" />
                                        </Button>
                                        
                                        {/* Actions Modal */}
                                        {showActionsModal && (
                                          <div className="absolute right-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]">
                                            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                                              Additional Actions
                                            </div>
                                            {additionalActions.slice(2 - (onEdit ? 1 : 0) - (onDelete ? 1 : 0)).map((action, idx) => (
                                              <button
                                                key={idx}
                                                onClick={(e) => {
                                                  handleAdditionalAction(e, action, item);
                                                  closeActionsModal();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                              >
                                                {action.icon && <action.icon className="h-4 w-4" />}
                                                <span>{action.label}</span>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  );
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, data.length)}</span> of{' '}
                  <span className="font-medium">{data.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleTable;
