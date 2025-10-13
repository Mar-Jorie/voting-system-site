// Candidates Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import CollapsibleTable from '../components/CollapsibleTable';
import FormModal from '../components/FormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InputFactory from '../components/InputFactory';
import SelectInput from '../components/SelectInput';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';

const CandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, _setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [deletingCandidate, setDeletingCandidate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    image: null
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = () => {
    const storedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    setCandidates(storedCandidates);
  };

  const handleAddCandidate = () => {
    setEditingCandidate(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      image: null
    });
    setShowFormModal(true);
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      category: candidate.category,
      description: candidate.description,
      image: candidate.image
    });
    setShowFormModal(true);
  };

  const handleDeleteCandidate = (candidate) => {
    setDeletingCandidate(candidate);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const newCandidate = {
      id: editingCandidate ? editingCandidate.id : Date.now().toString(),
      name: formData.name,
      category: formData.category,
      description: formData.description,
      image: formData.image,
      votes: editingCandidate ? editingCandidate.votes : 0,
      createdAt: editingCandidate ? editingCandidate.createdAt : new Date().toISOString()
    };

    let updatedCandidates;
    if (editingCandidate) {
      updatedCandidates = candidates.map(c => 
        c.id === editingCandidate.id ? newCandidate : c
      );
    } else {
      updatedCandidates = [...candidates, newCandidate];
    }

    setCandidates(updatedCandidates);
    localStorage.setItem('candidates', JSON.stringify(updatedCandidates));
    setShowFormModal(false);
    setEditingCandidate(null);
  };

  const handleDeleteConfirm = () => {
    const updatedCandidates = candidates.filter(c => c.id !== deletingCandidate.id);
    setCandidates(updatedCandidates);
    localStorage.setItem('candidates', JSON.stringify(updatedCandidates));
    setShowDeleteModal(false);
    setDeletingCandidate(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (item) => (
        <div className="flex items-center space-x-3">
          {item.image && (
            <img 
              src={item.image} 
              alt={item.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <span className="font-medium text-gray-900">{item.name}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.category === 'male' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-pink-100 text-pink-800'
        }`}>
          {item.category === 'male' ? 'Male' : 'Female'}
        </span>
      )
    },
    {
      key: 'votes',
      label: 'Votes',
      render: (item) => (
        <span className="font-semibold text-gray-900">{item.votes || 0}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Added',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  const renderExpandedContent = (candidate) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
        <p className="text-sm text-gray-600">{candidate.description || 'No description provided'}</p>
      </div>
      {candidate.image && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Image</h4>
          <img 
            src={candidate.image} 
            alt={candidate.name}
            className="w-32 h-32 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );

  const categoryOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          Candidates Management
        </h1>
        <p className="text-gray-600">
          Manage voting candidates and their information.
        </p>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <CollapsibleTable
          data={candidates}
          columns={columns}
          onEdit={handleEditCandidate}
          onDelete={handleDeleteCandidate}
          loading={loading}
          sortable={true}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
          expandableContent={renderExpandedContent}
          additionalActions={[
            { label: 'View Details', icon: EyeIcon, variant: 'secondaryOutline' }
          ]}
          searchPlaceholder="Search candidates..."
          emptyMessage="No candidates found. Add your first candidate to get started."
        />
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        title={editingCandidate ? "Edit Candidate" : "Add New Candidate"}
        submitButtonText={editingCandidate ? "Update Candidate" : "Add Candidate"}
        size="lg"
      >
        <div className="space-y-4">
          <InputFactory
            fieldName="name"
            config={{
              type: 'String',
              label: 'Candidate Name',
              placeholder: 'Enter candidate name',
              required: true
            }}
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
          />

          <SelectInput
            label="Category"
            options={categoryOptions}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            placeholder="Select category"
            required
          />

          <InputFactory
            fieldName="description"
            config={{
              type: 'Textarea',
              label: 'Description',
              placeholder: 'Enter candidate description (optional)'
            }}
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {formData.image && (
              <div className="mt-2">
                <img 
                  src={formData.image} 
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Candidate"
        message={`Are you sure you want to delete "${deletingCandidate?.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonVariant="danger"
        type="warning"
      />

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant="single"
        icon="PlusIcon"
        label="Add new candidate"
        action={handleAddCandidate}
      />
    </div>
  );
};

export default CandidatesPage;
