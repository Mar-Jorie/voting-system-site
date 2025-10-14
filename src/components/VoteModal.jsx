// VoteModal Component - MANDATORY PATTERN
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import InputFactory from './InputFactory';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';

const VoteModal = ({
  isOpen,
  onClose,
  candidate,
  onSubmit
}) => {
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
    
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      // Check if email has already voted for this category
      const existingVotes = await apiClient.findObjects('votes', {
        where: {
          voter_email: formData.email,
          category: candidate.category
        }
      });
      
      if (existingVotes.length > 0) {
        toast.error('You have already voted for this category');
        setLoading(false);
        return;
      }
      
      // Create the vote in the database
      const newVote = {
        candidate_id: candidate.id,
        voter_name: formData.name,
        voter_email: formData.email,
        category: candidate.category
      };
      
      await apiClient.createObject('votes', newVote);
      
      toast.success('Your vote has been recorded successfully!');
      onSubmit(formData);
      
      // Reset form
      setFormData({ name: '', email: '' });
      
      // Trigger vote update event for real-time updates
      window.dispatchEvent(new CustomEvent('votesUpdated'));
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cast Your Vote
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Candidate Info */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Photo</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-1">{candidate.name}</h4>
            <p className="text-primary-600 font-medium">{candidate.category}</p>
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
                label: 'Your Email',
                placeholder: 'Enter your email address',
                required: true,
                format: 'email'
              }}
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Submitting Vote...' : `Vote for ${candidate.name}`}
              </Button>
            </div>
          </form>

          {/* Important Notice */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Important:</strong> You can only vote once per category. Your email will be used to verify your vote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
