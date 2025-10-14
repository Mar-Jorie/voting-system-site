// FAQ Management Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, QuestionMarkCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CollapsibleTable from '../components/CollapsibleTable';
import SearchFilter from '../components/SearchFilter';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import { toast } from 'react-hot-toast';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    category: ''
  });

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingFaq, setDeletingFaq] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadFAQs();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [faqs, searchValue, filters]);

  const loadFAQs = () => {
    setLoading(true);
    try {
      const storedFAQs = JSON.parse(localStorage.getItem('faqs') || '[]');
      setFaqs(storedFAQs);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const saveFAQs = (updatedFAQs) => {
    try {
      localStorage.setItem('faqs', JSON.stringify(updatedFAQs));
      setFaqs(updatedFAQs);
    } catch (error) {
      console.error('Error saving FAQs:', error);
      toast.error('Failed to save FAQs');
    }
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
    try {
      const newFAQ = {
        id: editingFaq ? editingFaq.id : `faq-${Date.now()}`,
        question: formData.question,
        answer: formData.answer,
        keywords: Array.isArray(formData.keywords) ? formData.keywords : 
                 formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
        category: formData.category || 'general',
        createdAt: editingFaq ? editingFaq.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedFAQs;
      if (editingFaq) {
        updatedFAQs = faqs.map(faq => 
          faq.id === editingFaq.id ? newFAQ : faq
        );
        toast.success('FAQ updated successfully');
      } else {
        updatedFAQs = [...faqs, newFAQ];
        toast.success('FAQ added successfully');
      }

      saveFAQs(updatedFAQs);
      setShowFormModal(false);
      setEditingFaq(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ');
    }
  };

  const handleConfirmDelete = () => {
    try {
      const updatedFAQs = faqs.filter(faq => faq.id !== deletingFaq.id);
      saveFAQs(updatedFAQs);
      setShowDeleteModal(false);
      setDeletingFaq(null);
      toast.success('FAQ deleted successfully');
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
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
        <div className="max-w-xs">
          <p className="font-medium text-gray-900 truncate" title={value}>
            {value}
          </p>
        </div>
      )
    },
    {
      key: 'answer',
      label: 'Answer',
      render: (value) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 truncate" title={value}>
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
          getUniqueCompanies={() => []}
          className="bg-gray-50 border-gray-200"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <CollapsibleTable
          data={filteredFaqs}
          columns={columns}
          onEdit={handleEditFAQ}
          onDelete={handleDeleteFAQ}
          loading={loading}
          sortable={true}
          searchable={false}
          pagination={true}
          itemsPerPage={10}
          expandableContent={expandableContent}
          searchPlaceholder="Search FAQs..."
          emptyMessage="No FAQs found"
          enableSelection={false}
        />
      </div>

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant="single"
        icon="PlusIcon"
        label="Add new FAQ"
        action={handleAddFAQ}
        quickActions={[
          { name: 'Add FAQ', icon: 'PlusIcon', action: handleAddFAQ, color: 'bg-primary-600' }
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
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="danger"
      />
    </div>
  );
};

export default FAQPage;
