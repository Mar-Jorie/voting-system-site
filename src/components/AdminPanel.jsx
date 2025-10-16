import React, { useState, useEffect } from 'react';
import { PlusIcon, PhotoIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import InputFactory from './InputFactory';
import SelectInput from './SelectInput';
import FormModal from './FormModal';
import ConfirmationModal from './ConfirmationModal';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';

const AdminPanel = () => {
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    image: null
  });
  const [pendingFormData, setPendingFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Loading states for confirmation modals
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const categoryOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch candidates and votes from database
      const [candidatesData, votesData] = await Promise.all([
        apiClient.findObjects('candidates', {}),
        apiClient.findObjects('votes', {})
      ]);
      
      setCandidates(candidatesData);
      setVotes(votesData);
    } catch (error) {
      // Error loading data - handled silently
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      image: null
    });
    setSelectedCandidate(null);
    setShowAddModal(true);
  };

  const handleEditCandidate = (candidate) => {
    setFormData({
      name: candidate.name,
      category: candidate.category,
      description: candidate.description,
      image: candidate.image
    });
    setSelectedCandidate(candidate);
    setShowEditModal(true);
  };

  const handleDeleteCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (formData) => {
    setPendingFormData(formData);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaveLoading(true);
    try {
      if (selectedCandidate) {
        // Edit existing candidate
        await apiClient.updateObject('candidates', selectedCandidate.id, pendingFormData);
        toast.success('Candidate updated successfully');
        setShowEditModal(false);
      } else {
        // Add new candidate
        await apiClient.createObject('candidates', pendingFormData);
        toast.success('Candidate added successfully');
        setShowAddModal(false);
      }
      
      // Reload data to get updated candidates
      await loadData();
      
      setFormData({
        name: '',
        category: '',
        description: '',
        image: null
      });
      setSelectedCandidate(null);
      setShowConfirmModal(false);
      setPendingFormData(null);
    } catch (error) {
      // Error saving candidate - handled silently
      toast.error('Failed to save candidate');
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

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.deleteObject('candidates', selectedCandidate.id);
      toast.success('Candidate deleted successfully');
      setShowDeleteModal(false);
      setSelectedCandidate(null);
      
      // Reload data to get updated candidates
      await loadData();
    } catch (error) {
      // Error deleting candidate - handled silently
      toast.error('Failed to delete candidate');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getCandidatesByCategory = (category) => {
    return candidates.filter(candidate => candidate.category === category);
  };

  const getTotalVotes = () => {
    return votes.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Statistics */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Voting Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{getTotalVotes()}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getCandidatesByCategory('male').length}</div>
            <div className="text-sm text-gray-600">Male Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{getCandidatesByCategory('female').length}</div>
            <div className="text-sm text-gray-600">Female Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{candidates.length}</div>
            <div className="text-sm text-gray-600">Total Candidates</div>
          </div>
        </div>
      </div>

      {/* Add Candidate Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleAddCandidate}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Candidate
        </Button>
      </div>

      {/* Male Candidates */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Male Candidates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCandidatesByCategory('male').map((candidate) => (
            <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  {candidate.image ? (
                    <img
                      src={candidate.image}
                      alt={candidate.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                <div className="mt-2 text-sm font-medium text-primary-600">
                  {candidate.votes} votes
                </div>
                <div className="mt-3 flex justify-center space-x-2">
                  <Button
                    variant="secondaryOutline"
                    size="sm"
                    onClick={() => handleEditCandidate(candidate)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteCandidate(candidate)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Female Candidates */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Female Candidates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCandidatesByCategory('female').map((candidate) => (
            <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  {candidate.image ? (
                    <img
                      src={candidate.image}
                      alt={candidate.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                <div className="mt-2 text-sm font-medium text-primary-600">
                  {candidate.votes} votes
                </div>
                <div className="mt-3 flex justify-center space-x-2">
                  <Button
                    variant="secondaryOutline"
                    size="sm"
                    onClick={() => handleEditCandidate(candidate)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteCandidate(candidate)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Candidate Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleFormSubmit}
        title="Add New Candidate"
        submitButtonText="Add Candidate"
      >
        <InputFactory
          fieldName="name"
          config={{
            type: 'String',
            label: 'Candidate Name',
            placeholder: 'Enter candidate name',
            required: true
          }}
          value={formData.name}
          onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
        />

        <SelectInput
          label="Category"
          options={categoryOptions}
          value={formData.category}
          onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          placeholder="Select category"
          required
        />

        <InputFactory
          fieldName="description"
          config={{
            type: 'Textarea',
            label: 'Description',
            placeholder: 'Enter candidate description',
            required: true
          }}
          value={formData.description}
          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Candidate Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </FormModal>

      {/* Edit Candidate Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleFormSubmit}
        title="Edit Candidate"
        submitButtonText="Update Candidate"
      >
        <InputFactory
          fieldName="name"
          config={{
            type: 'String',
            label: 'Candidate Name',
            placeholder: 'Enter candidate name',
            required: true
          }}
          value={formData.name}
          onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
        />

        <SelectInput
          label="Category"
          options={categoryOptions}
          value={formData.category}
          onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          placeholder="Select category"
          required
        />

        <InputFactory
          fieldName="description"
          config={{
            type: 'Textarea',
            label: 'Description',
            placeholder: 'Enter candidate description',
            required: true
          }}
          value={formData.description}
          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Candidate Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Candidate"
        message={`Are you sure you want to delete "${selectedCandidate?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteLoading}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Confirm Save"
        message={`Are you sure you want to ${selectedCandidate ? 'update' : 'create'} this candidate?`}
        confirmLabel={selectedCandidate ? "Update Candidate" : "Create Candidate"}
        cancelLabel="Cancel"
        loading={saveLoading}
        variant="info"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </div>
  );
};

export default AdminPanel;
