// FAQ Management Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, QuestionMarkCircleIcon, EllipsisVerticalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CollapsibleTable from '../components/CollapsibleTable';
import SearchFilter from '../components/SearchFilter';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import { toast } from 'react-hot-toast';
import { ProgressiveLoader, TableSkeleton } from '../components/SkeletonLoader';
import apiClient from '../usecases/api';
import auditLogger from '../utils/auditLogger.js';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    category: ''
  });

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingFaq, setDeletingFaq] = useState(null);
  const [formData, setFormData] = useState({});
  const [pendingFormData, setPendingFormData] = useState(null);
  
  // Selection state
  const [selectedFaqs, setSelectedFaqs] = useState(new Set());
  
  // Loading states for confirmation modals
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    loadFAQs();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [faqs, searchValue, filters]);

  const loadFAQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const faqsData = await apiClient.findObjects('faqs', {});
      setFaqs(faqsData);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setError(error.message || 'Failed to load FAQs');
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadFAQs();
  };


  const filterFAQs = () => {
    let filtered = [...faqs];

    // Search filter
    if (searchValue) {
      filtered = filtered.filter(faq => 
        faq.question?.toLowerCase().includes(searchValue.toLowerCase()) ||
        faq.answer?.toLowerCase().includes(searchValue.toLowerCase()) ||
        faq.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchValue.toLowerCase())
        )
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(faq => faq.category === filters.category);
    }

    setFilteredFaqs(filtered);
  };

  const handleAddFAQ = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      keywords: [],
      category: 'general'
    });
    setShowFormModal(true);
  };

  const handleEditFAQ = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords || [],
      category: faq.category || 'general'
    });
    setShowFormModal(true);
  };

  const handleDeleteFAQ = (faq) => {
    setDeletingFaq(faq);
    setShowDeleteModal(true);
  };

  const handleSubmitFAQ = async (formData) => {
    setPendingFormData(formData);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaveLoading(true);
    try {
      const faqData = {
        question: pendingFormData.question,
        answer: pendingFormData.answer,
        keywords: Array.isArray(pendingFormData.keywords) ? pendingFormData.keywords : 
                 pendingFormData.keywords ? pendingFormData.keywords.split(',').map(k => k.trim()) : [],
        category: pendingFormData.category || 'general'
      };

      if (editingFaq) {
        await apiClient.updateObject('faqs', editingFaq.id, faqData);
        await auditLogger.logUpdate('faq', editingFaq.id, faqData.question, {
          category: faqData.category,
          answer: faqData.answer
        });
        toast.success('FAQ updated successfully');
      } else {
        const newFaq = await apiClient.createObject('faqs', faqData);
        await auditLogger.logCreate('faq', newFaq.id, faqData.question, {
          category: faqData.category,
          answer: faqData.answer
        });
        toast.success('FAQ added successfully');
      }

      // Reload FAQs from database
      await loadFAQs();
      
      setShowFormModal(false);
      setEditingFaq(null);
      setFormData({});
      setShowConfirmModal(false);
      setPendingFormData(null);
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ');
      setShowConfirmModal(false);
      setPendingFormData(null);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
    setPendingFormData(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.deleteObject('faqs', deletingFaq.id);
      await auditLogger.logDelete('faq', deletingFaq.id, deletingFaq.question, {
        category: deletingFaq.category
      });
      setShowDeleteModal(false);
      setDeletingFaq(null);
      toast.success('FAQ deleted successfully');
      
      // Reload FAQs from database
      await loadFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleSearch = () => {
    filterFAQs();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Selection handlers
  const handleSelectionChange = (newSelectedFaqs) => {
    setSelectedFaqs(newSelectedFaqs);
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedFaqs.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleteLoading(true);
    try {
      const faqsToDelete = filteredFaqs.filter(faq => selectedFaqs.has(faq.id));
      
      // Delete all selected FAQs from database
      await Promise.all(
        faqsToDelete.map(faq => apiClient.deleteObject('faqs', faq.id))
      );
      
      // Log bulk delete operation
      await auditLogger.log({
        action: 'delete',
        entity_type: 'faq',
        entity_name: `${faqsToDelete.length} FAQs`,
        details: {
          count: faqsToDelete.length,
          faq_ids: faqsToDelete.map(f => f.id),
          questions: faqsToDelete.map(f => f.question)
        },
        category: 'data_management',
        severity: 'warning'
      });
      
      setSelectedFaqs(new Set());
      setShowBulkDeleteModal(false);
      toast.success(`${faqsToDelete.length} FAQ(s) deleted successfully`);
      
      // Reload FAQs from database
      await loadFAQs();
    } catch (error) {
      console.error('Error deleting FAQs:', error);
      toast.error('Failed to delete FAQs');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedFaqs.size === 0) return;
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const faqsToExport = filteredFaqs.filter(faq => selectedFaqs.has(faq.id));
    
    // Create CSV headers
    const headers = ['Question', 'Answer', 'Category', 'Last Updated'];
    
    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...faqsToExport.map(faq => [
        `"${faq.question.replace(/"/g, '""')}"`,
        `"${faq.answer.replace(/"/g, '""')}"`,
        `"${faq.category}"`,
        `"${new Date(faq.lastUpdated).toLocaleDateString()}"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faqs-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    toast.success(`${faqsToExport.length} FAQ(s) exported as CSV successfully`);
  };

  const exportAsPDF = () => {
    const faqsToExport = filteredFaqs.filter(faq => selectedFaqs.has(faq.id));
    
    // Close the export modal first
    setShowExportModal(false);
    
    // Add print styles to hide interface elements
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        nav, header, .sidebar, .floating-chatbot, .smart-floating-action-button {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Create print content
    const printElement = document.createElement('div');
    printElement.className = 'print-content';
    printElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; margin: 20px; background: white; color: black;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px; font-size: 24px;">FAQ Export Report</h1>
          <p style="color: #666; margin: 5px 0;">Generated: ${new Date().toLocaleDateString()}</p>
          <p style="color: #666; margin: 5px 0;">Total FAQs: ${faqsToExport.length}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; width: 5%;">#</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; width: 25%;">Question</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; width: 50%;">Answer</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; width: 10%;">Category</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; width: 10%;">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            ${faqsToExport.map((faq, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                <td style="border: 1px solid #dee2e6; padding: 12px; vertical-align: top;">${index + 1}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px; vertical-align: top; font-weight: 500;">${faq.question}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px; vertical-align: top; line-height: 1.4;">${faq.answer}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px; vertical-align: top;">
                  <span style="background-color: ${faq.category === 'general' ? '#e9ecef' : faq.category === 'voting' ? '#cce5ff' : faq.category === 'technical' ? '#d4edda' : '#e2e3e5'}; color: ${faq.category === 'general' ? '#495057' : faq.category === 'voting' ? '#004085' : faq.category === 'technical' ? '#155724' : '#6c757d'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                    ${faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                  </span>
                </td>
                <td style="border: 1px solid #dee2e6; padding: 12px; vertical-align: top; font-size: 12px;">${faq.updatedAt ? new Date(faq.updatedAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
          <p>Generated by Voting System - ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(printElement);
    
    // Use setTimeout to ensure the modal closes before printing
    setTimeout(() => {
      window.print();
      
      // Clean up after printing
      document.body.removeChild(printElement);
      document.head.removeChild(printStyles);
      
      toast.success(`${faqsToExport.length} FAQ(s) exported as PDF successfully`);
    }, 100);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'question',
      label: 'Question',
      render: (value) => (
        <div className="text-center">
          <p className="font-medium text-gray-900" title={value}>
            {value}
          </p>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'general' ? 'bg-gray-100 text-gray-800' :
          value === 'voting' ? 'bg-blue-100 text-blue-800' :
          value === 'technical' ? 'bg-green-100 text-green-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {formatDate(value)}
        </span>
      )
    }
  ];

  const expandableContent = (faq) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Full Answer</h4>
          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
            {faq.answer}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {faq.keywords && faq.keywords.length > 0 ? (
              faq.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500 italic">No keywords set</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'voting', label: 'Voting' },
    { value: 'technical', label: 'Technical' },
    { value: 'account', label: 'Account' }
  ];

  const formFields = [
    {
      name: 'question',
      label: 'Question',
      type: 'String',
      placeholder: 'Enter the FAQ question',
      required: true
    },
    {
      name: 'answer',
      label: 'Answer',
      type: 'String',
      placeholder: 'Enter the detailed answer',
      required: true
    },
    {
      name: 'keywords',
      label: 'Keywords (comma-separated)',
      type: 'String',
      placeholder: 'keyword1, keyword2, keyword3',
      required: false
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'general', label: 'General' },
        { value: 'voting', label: 'Voting' },
        { value: 'technical', label: 'Technical' },
        { value: 'account', label: 'Account' }
      ],
      required: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          FAQ Management
        </h1>
        <p className="text-gray-600">
          Manage frequently asked questions and their answers for the chatbot.
        </p>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <SearchFilter
          placeholder="Search by question, answer, or keywords..."
          value={searchValue}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filters={filters}
          useSelectForSearch={false}
          statusOptions={categoryOptions}
          statusLabel="Category"
          statusFilterKey="category"
          getUniqueCompanies={() => []}
          className="bg-gray-50 border-gray-200"
        />
      </div>

      {/* Progressive Loading with Skeleton */}
      <ProgressiveLoader
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={TableSkeleton}
      >
        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <CollapsibleTable
            data={filteredFaqs}
            columns={columns}
            onEdit={handleEditFAQ}
            onDelete={handleDeleteFAQ}
            loading={false}
            sortable={true}
            searchable={false}
            pagination={true}
            itemsPerPage={10}
            expandableContent={expandableContent}
            searchPlaceholder="Search FAQs..."
            emptyMessage="No FAQs found"
            enableSelection={true}
            selectedRows={selectedFaqs}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </ProgressiveLoader>

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant={selectedFaqs.size > 0 ? "dots" : "single"}
        icon={selectedFaqs.size > 0 ? "EllipsisVerticalIcon" : "PlusIcon"}
        label={selectedFaqs.size > 0 ? "Toggle bulk actions" : "Add new FAQ"}
        action={selectedFaqs.size > 0 ? () => {} : handleAddFAQ}
        selectedCount={selectedFaqs.size}
        quickActions={[
          { name: 'Add FAQ', icon: 'PlusIcon', action: handleAddFAQ, color: 'bg-primary-600' }
        ]}
        bulkActions={[
          { name: 'Export Selected', icon: 'ArrowDownTrayIcon', action: handleBulkExport, color: 'bg-blue-600' },
          { name: 'Delete Selected', icon: 'TrashIcon', action: handleBulkDelete, color: 'bg-red-600' }
        ]}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingFaq(null);
          setFormData({});
        }}
        onSubmit={handleSubmitFAQ}
        title={editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
        fields={formFields}
        initialData={formData}
        loading={false}
        isUpdate={!!editingFaq}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Confirm Save"
        message={`Are you sure you want to ${editingFaq ? 'update' : 'create'} this FAQ?`}
        confirmLabel={editingFaq ? "Update FAQ" : "Create FAQ"}
        cancelLabel="Cancel"
        loading={saveLoading}
        variant="info"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingFaq(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete FAQ"
        message={`Are you sure you want to delete the FAQ "${deletingFaq?.question}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteLoading}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="danger"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected FAQs"
        message={`Are you sure you want to delete ${selectedFaqs.size} selected FAQ(s)? This action cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        loading={bulkDeleteLoading}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="danger"
      />

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowExportModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Selected FAQs</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose export format for {selectedFaqs.size} selected FAQ(s):
                </p>
                <div className="space-y-3">
                  <Button
                    variant="primaryOutline"
                    size="md"
                    onClick={exportAsCSV}
                    className="w-full"
                  >
                    Export as CSV
                  </Button>
                  <Button
                    variant="secondaryOutline"
                    size="md"
                    onClick={exportAsPDF}
                    className="w-full"
                  >
                    Export as PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQPage;
