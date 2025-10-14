import React, { useState, useEffect } from 'react';
import { PhotoIcon, UserIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import VotingModal from './VotingModal';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';

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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch candidates and votes from database
      const [candidatesData, votesData] = await Promise.all([
        apiClient.findObjects('candidates', {}),
        apiClient.findObjects('votes', {})
      ]);
      
      // Calculate vote counts for each candidate
      const candidatesWithVotes = candidatesData.map(candidate => {
        let voteCount = 0;
        
        // Count votes from the new single vote structure
        votesData.forEach(vote => {
          if (vote.vote_type === 'dual_selection') {
            // Check if this candidate is selected as male or female
            if (vote.male_candidate_id === candidate.id || vote.female_candidate_id === candidate.id) {
              voteCount++;
            }
          } else if (vote.candidate_id === candidate.id) {
            // Handle legacy votes (if any exist)
            voteCount++;
          }
        });
        
        return { ...candidate, votes: voteCount };
      });
      
      setCandidates(candidatesWithVotes);
      setVotes(votesData);
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

  const handleVoteSubmit = async (voterInfo) => {
    try {
      // Check if email has already voted
      const existingVotes = await apiClient.findObjects('votes', {
        where: { voter_email: voterInfo.email }
      });
      
      if (existingVotes.length > 0) {
        toast.error('This email has already voted');
        return;
      }

      // Create a single vote entry with both male and female candidates
      const vote = {
        male_candidate_id: selectedCandidates.male.id,
        male_candidate_name: selectedCandidates.male.name,
        female_candidate_id: selectedCandidates.female.id,
        female_candidate_name: selectedCandidates.female.name,
        voter_email: voterInfo.email,
        voter_name: voterInfo.name,
        vote_type: 'dual_selection' // Indicates this is a vote for both categories
      };

      // Create single vote in the database
      await apiClient.createObject('votes', vote);

      // Reload data to get updated vote counts
      await loadData();

      toast.success('Vote submitted successfully!');
      setShowVotingModal(false);
      setSelectedCandidates({ male: null, female: null });
      
      // Trigger vote update event for real-time updates
      window.dispatchEvent(new CustomEvent('votesUpdated'));
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
