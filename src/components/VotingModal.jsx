import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import InputFactory from './InputFactory';

const VotingModal = ({ isOpen, onClose, onSubmit, selectedCandidates }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={onClose}></div>
        
        {/* Modal Content */}
        <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Your Vote</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Selected Candidates Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Selections:</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Male Candidate:</span>
                <span className="font-medium text-gray-900">{selectedCandidates.male?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Female Candidate:</span>
                <span className="font-medium text-gray-900">{selectedCandidates.female?.name}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputFactory
              fieldName="name"
              config={{
                type: 'String',
                label: 'Your Name',
                placeholder: 'Enter your full name',
                required: true
              }}
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
            />

            <InputFactory
              fieldName="email"
              config={{
                type: 'String',
                label: 'Email Address',
                placeholder: 'Enter your email address',
                required: true,
                format: 'email'
              }}
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondaryOutline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                Submit Vote
              </Button>
            </div>
          </form>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Each email address can only vote once. Your vote will be recorded anonymously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingModal;
