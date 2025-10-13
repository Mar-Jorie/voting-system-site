// Voting Page - MANDATORY PATTERN
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import InputFactory from '../components/InputFactory';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';

const VotingPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState({
    male: null,
    female: null
  });
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voterInfo, setVoterInfo] = useState({
    name: '',
    email: ''
  });
  const [votingComplete, setVotingComplete] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    loadCandidates();
    checkVotingStatus();
  }, [checkVotingStatus]);

  const loadCandidates = () => {
    const storedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    setCandidates(storedCandidates);
  };

  const checkVotingStatus = useCallback(() => {
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    const userEmail = localStorage.getItem('voterEmail');
    
    if (userEmail && votes.some(vote => vote.voterEmail === userEmail)) {
      setHasVoted(true);
      const userVote = votes.find(vote => vote.voterEmail === userEmail);
      setSelectedCandidates({
        male: candidates.find(c => c.id === userVote.maleCandidateId),
        female: candidates.find(c => c.id === userVote.femaleCandidateId)
      });
    }
  }, [candidates]);

  const handleCandidateSelect = (candidate) => {
    if (hasVoted) return; // Prevent changes if already voted

    setSelectedCandidates(prev => ({
      ...prev,
      [candidate.category]: candidate
    }));
  };

  const handleVote = () => {
    if (!selectedCandidates.male || !selectedCandidates.female) {
      alert('Please select one candidate from each category');
      return;
    }
    setShowVoteModal(true);
  };

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    
    // Check if email has already voted
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    if (votes.some(vote => vote.voterEmail === voterInfo.email)) {
      alert('This email has already voted. Each email can only vote once.');
      return;
    }

    // Create vote record
    const newVote = {
      id: Date.now().toString(),
      voterName: voterInfo.name,
      voterEmail: voterInfo.email,
      maleCandidateId: selectedCandidates.male.id,
      femaleCandidateId: selectedCandidates.female.id,
      timestamp: new Date().toISOString()
    };

    // Save vote
    const updatedVotes = [...votes, newVote];
    localStorage.setItem('votes', JSON.stringify(updatedVotes));
    localStorage.setItem('voterEmail', voterInfo.email);

    // Update candidate vote counts
    const updatedCandidates = candidates.map(candidate => {
      if (candidate.id === selectedCandidates.male.id || candidate.id === selectedCandidates.female.id) {
        return { ...candidate, votes: (candidate.votes || 0) + 1 };
      }
      return candidate;
    });
    setCandidates(updatedCandidates);
    localStorage.setItem('candidates', JSON.stringify(updatedCandidates));

    setVotingComplete(true);
    setHasVoted(true);
    setShowVoteModal(false);
  };

  const handleResetVote = () => {
    setSelectedCandidates({ male: null, female: null });
    setVotingComplete(false);
    setHasVoted(false);
    localStorage.removeItem('voterEmail');
  };

  const maleCandidates = candidates.filter(c => c.category === 'male');
  const femaleCandidates = candidates.filter(c => c.category === 'female');

  if (votingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Vote Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for voting! Your vote has been recorded successfully.
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Male Category</p>
              <p className="font-medium text-gray-900">{selectedCandidates.male?.name}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Female Category</p>
              <p className="font-medium text-gray-900">{selectedCandidates.female?.name}</p>
            </div>
          </div>
          <Button 
            variant="primary" 
            onClick={handleResetVote}
            className="mt-6"
          >
            Vote Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          Cast Your Vote
        </h1>
        <p className="text-gray-600">
          Select one candidate from each category to cast your vote.
        </p>
      </div>

      <div className="space-y-8">
        {/* Male Category */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Male Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maleCandidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => handleCandidateSelect(candidate)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCandidates.male?.id === candidate.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {candidate.image && (
                  <img 
                    src={candidate.image} 
                    alt={candidate.name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-gray-900 mb-1">{candidate.name}</h3>
                {candidate.description && (
                  <p className="text-sm text-gray-600">{candidate.description}</p>
                )}
                {selectedCandidates.male?.id === candidate.id && (
                  <div className="flex items-center justify-center mt-2">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                    <span className="ml-1 text-sm font-medium text-primary-600">Selected</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Female Category */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Female Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {femaleCandidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => handleCandidateSelect(candidate)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCandidates.female?.id === candidate.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {candidate.image && (
                  <img 
                    src={candidate.image} 
                    alt={candidate.name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-gray-900 mb-1">{candidate.name}</h3>
                {candidate.description && (
                  <p className="text-sm text-gray-600">{candidate.description}</p>
                )}
                {selectedCandidates.female?.id === candidate.id && (
                  <div className="flex items-center justify-center mt-2">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                    <span className="ml-1 text-sm font-medium text-primary-600">Selected</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vote Button */}
        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleVote}
            disabled={!selectedCandidates.male || !selectedCandidates.female || hasVoted}
            className="px-8"
          >
            {hasVoted ? 'Already Voted' : 'Cast Vote'}
          </Button>
        </div>
      </div>

      {/* Vote Modal */}
      <FormModal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        onSubmit={handleVoteSubmit}
        title="Confirm Your Vote"
        submitButtonText="Submit Vote"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Your Selections:</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Male Category:</span>
                <span className="font-medium">{selectedCandidates.male?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Female Category:</span>
                <span className="font-medium">{selectedCandidates.female?.name}</span>
              </div>
            </div>
          </div>

          <InputFactory
            fieldName="name"
            config={{
              type: 'String',
              label: 'Your Name',
              placeholder: 'Enter your full name',
              required: true
            }}
            value={voterInfo.name}
            onChange={(value) => setVoterInfo({ ...voterInfo, name: value })}
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
            value={voterInfo.email}
            onChange={(value) => setVoterInfo({ ...voterInfo, email: value })}
          />

          <p className="text-sm text-gray-600">
            By submitting your vote, you confirm that you have not voted before and that the information provided is accurate.
          </p>
        </div>
      </FormModal>

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant="single"
        icon="CheckCircleIcon"
        label="Cast vote"
        action={handleVote}
      />
    </div>
  );
};

export default VotingPage;
