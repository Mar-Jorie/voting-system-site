import React, { useState, useEffect } from 'react';
import { PhotoIcon, UserIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import VotingModal from './VotingModal';
import { toast } from 'react-hot-toast';

const VotingInterface = () => {
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState({
    male: null,
    female: null
  });
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const storedCandidates = localStorage.getItem('candidates');
      const storedVotes = localStorage.getItem('votes');

      if (storedCandidates) {
        setCandidates(JSON.parse(storedCandidates));
      }

      if (storedVotes) {
        setVotes(JSON.parse(storedVotes));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [candidate.category]: candidate
    }));
  };

  const handleVote = () => {
    if (!selectedCandidates.male || !selectedCandidates.female) {
      toast.error('Please select one candidate from each category');
      return;
    }

    setShowVotingModal(true);
  };

  const handleVoteSubmit = (voterInfo) => {
    try {
      // Check if email has already voted
      const existingVote = votes.find(vote => vote.email === voterInfo.email);
      if (existingVote) {
        toast.error('This email has already voted');
        return;
      }

      // Create new vote
      const newVote = {
        id: Date.now().toString(),
        voterName: voterInfo.name,
        email: voterInfo.email,
        maleCandidate: selectedCandidates.male.id,
        femaleCandidate: selectedCandidates.female.id,
        timestamp: new Date().toISOString()
      };

      // Update votes
      const updatedVotes = [...votes, newVote];
      setVotes(updatedVotes);
      localStorage.setItem('votes', JSON.stringify(updatedVotes));

      // Update candidate vote counts
      const updatedCandidates = candidates.map(candidate => {
        if (candidate.id === selectedCandidates.male.id || candidate.id === selectedCandidates.female.id) {
          return { ...candidate, votes: candidate.votes + 1 };
        }
        return candidate;
      });
      setCandidates(updatedCandidates);
      localStorage.setItem('candidates', JSON.stringify(updatedCandidates));

      toast.success('Vote submitted successfully!');
      setShowVotingModal(false);
      setSelectedCandidates({ male: null, female: null });
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
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
      {/* Voting Statistics */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Voting Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{getTotalVotes()}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{candidates.length}</div>
            <div className="text-sm text-gray-600">Total Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
        </div>
      </div>

      {/* Male Candidates */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
          Male Candidates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCandidatesByCategory('male').map((candidate) => (
            <div
              key={candidate.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedCandidates.male?.id === candidate.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleCandidateSelect(candidate)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  {candidate.image ? (
                    <img
                      src={candidate.image}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                <div className="mt-2 text-sm font-medium text-primary-600">
                  {candidate.votes} votes
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Female Candidates */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-pink-600" />
          Female Candidates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCandidatesByCategory('female').map((candidate) => (
            <div
              key={candidate.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedCandidates.female?.id === candidate.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleCandidateSelect(candidate)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  {candidate.image ? (
                    <img
                      src={candidate.image}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                <div className="mt-2 text-sm font-medium text-primary-600">
                  {candidate.votes} votes
                </div>
              </div>
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
          disabled={!selectedCandidates.male || !selectedCandidates.female}
        >
          Submit Vote
        </Button>
      </div>

      {/* Voting Modal */}
      {showVotingModal && (
        <VotingModal
          isOpen={showVotingModal}
          onClose={() => setShowVotingModal(false)}
          onSubmit={handleVoteSubmit}
          selectedCandidates={selectedCandidates}
        />
      )}
    </div>
  );
};

export default VotingInterface;
