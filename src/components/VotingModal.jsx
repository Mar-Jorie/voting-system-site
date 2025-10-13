import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import FormModal from './FormModal';
import ImageCarousel from './ImageCarousel';
import SearchFilter from './SearchFilter';
import Pagination from './Pagination';

const VotingModal = ({ isOpen, onClose }) => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
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
  
  // Filter and pagination state
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4); // 2 per category

  const loadCandidates = () => {
    const storedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    // Load vote counts for each candidate
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    const candidatesWithVotes = storedCandidates.map(candidate => {
      const candidateVotes = votes.filter(vote => 
        vote.maleCandidateId === candidate.id || vote.femaleCandidateId === candidate.id
      ).length;
      return { ...candidate, votes: candidateVotes };
    });
    setCandidates(candidatesWithVotes);
    setFilteredCandidates(candidatesWithVotes);
  };

  // Filter candidates based on search and filters
  useEffect(() => {
    let filtered = candidates;
    
    // Search filter
    if (searchValue) {
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        candidate.description.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // Category filter
    if (filters.category) {
      filtered = filtered.filter(candidate => candidate.category === filters.category);
    }
    
    setFilteredCandidates(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [candidates, searchValue, filters]);

  const checkVotingStatus = useCallback(() => {
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    const userEmail = localStorage.getItem('voterEmail');
    
    if (userEmail && votes.some(vote => vote.voterEmail === userEmail)) {
      setHasVoted(true);
      const userVote = votes.find(vote => vote.voterEmail === userEmail);
      const storedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
      setSelectedCandidates({
        male: storedCandidates.find(c => c.id === userVote.maleCandidateId),
        female: storedCandidates.find(c => c.id === userVote.femaleCandidateId)
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
      checkVotingStatus();
    }
  }, [isOpen, checkVotingStatus]);

  // Filter handlers
  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

  // Get candidates by category
  const maleCandidates = paginatedCandidates.filter(candidate => candidate.category === 'male');
  const femaleCandidates = paginatedCandidates.filter(candidate => candidate.category === 'female');

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
    
    if (!voterInfo.name || !voterInfo.email) {
      alert('Please fill in all fields');
      return;
    }

    // Check if email already voted
    const existingVotes = JSON.parse(localStorage.getItem('votes') || '[]');
    if (existingVotes.some(vote => vote.voterEmail === voterInfo.email)) {
      alert('This email has already voted');
      return;
    }

    // Save vote
    const newVote = {
      id: Date.now().toString(),
      voterEmail: voterInfo.email,
      voterName: voterInfo.name,
      maleCandidateId: selectedCandidates.male.id,
      femaleCandidateId: selectedCandidates.female.id,
      timestamp: new Date().toISOString()
    };

    const updatedVotes = [...existingVotes, newVote];
    localStorage.setItem('votes', JSON.stringify(updatedVotes));
    localStorage.setItem('voterEmail', voterInfo.email);

    // Reload candidates with updated vote counts
    loadCandidates();

    setVotingComplete(true);
    setHasVoted(true);
    setShowVoteModal(false);
  };

  // const handleVoterInfoChange = (field, value) => {
  //   setVoterInfo(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };

  const handleClose = () => {
    setVotingComplete(false);
    setShowVoteModal(false);
    setVoterInfo({ name: '', email: '' });
    onClose();
  };

  // Form fields for the vote modal
  const voteFormFields = [
    {
      name: 'name',
      type: 'String',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true
    },
    {
      name: 'email',
      type: 'String',
      label: 'Email Address',
      placeholder: 'Enter your email',
      required: true,
      format: 'email'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={handleClose}></div>
          
          {/* Modal Content */}
          <div className="relative z-50 w-full max-w-6xl max-h-[90vh] overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-semibold text-gray-900">
                {votingComplete ? 'Vote Submitted Successfully!' : 'Cast Your Vote'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              {votingComplete ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Vote Submitted Successfully!</h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for participating in the voting process. Your vote has been recorded.
                  </p>
                  <Button variant="primary" size="md" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Page Header */}
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
                      Cast Your Vote
                    </h1>
                    <p className="text-gray-600">
                      Select one candidate from each category to cast your vote.
                    </p>
                    {hasVoted && (
                      <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 rounded-full">
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">You have already voted</span>
                      </div>
                    )}
                  </div>

                  {/* Filters Section */}
                  <div>
                    <SearchFilter
                      placeholder="Search candidates..."
                      value={searchValue}
                      onChange={handleSearchChange}
                      onFilterChange={handleFilterChange}
                      filters={filters}
                      statusOptions={[
                        { value: '', label: 'All Categories' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                      ]}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>

                  {/* Male Category */}
                  {maleCandidates.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Male Category</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {maleCandidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            onClick={() => handleCandidateSelect(candidate)}
                            className={`group relative bg-white border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedCandidates.male?.id === candidate.id
                                ? 'border-primary-500 bg-primary-50 shadow-md'
                                : 'border-gray-200 hover:border-primary-300'
                            } ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {/* Selection Badge */}
                            {selectedCandidates.male?.id === candidate.id && (
                              <div className="absolute -top-1 -right-1 z-10">
                                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
                                  <CheckCircleIcon className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}

                            {/* Candidate Image */}
                            <div className="aspect-square overflow-hidden rounded-t-lg">
                              {candidate.image ? (
                                Array.isArray(candidate.image) && candidate.image.length > 1 ? (
                                  <ImageCarousel images={candidate.image} />
                                ) : (
                                  <img
                                    src={Array.isArray(candidate.image) ? candidate.image[0] : candidate.image}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                )
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <UserIcon className="h-16 w-16 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Candidate Info */}
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{candidate.name}</h3>
                              {candidate.description && (
                                <p className="text-sm text-gray-600 mb-3">{candidate.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                  <span className="font-medium text-primary-600">{candidate.votes || 0}</span> votes
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Female Category */}
                  {femaleCandidates.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center mr-3">
                          <UserIcon className="h-5 w-5 text-pink-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Female Category</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {femaleCandidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            onClick={() => handleCandidateSelect(candidate)}
                            className={`group relative bg-white border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedCandidates.female?.id === candidate.id
                                ? 'border-primary-500 bg-primary-50 shadow-md'
                                : 'border-gray-200 hover:border-primary-300'
                            } ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {/* Selection Badge */}
                            {selectedCandidates.female?.id === candidate.id && (
                              <div className="absolute -top-1 -right-1 z-10">
                                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
                                  <CheckCircleIcon className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}

                            {/* Candidate Image */}
                            <div className="aspect-square overflow-hidden rounded-t-lg">
                              {candidate.image ? (
                                Array.isArray(candidate.image) && candidate.image.length > 1 ? (
                                  <ImageCarousel images={candidate.image} />
                                ) : (
                                  <img
                                    src={Array.isArray(candidate.image) ? candidate.image[0] : candidate.image}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                )
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <UserIcon className="h-16 w-16 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Candidate Info */}
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{candidate.name}</h3>
                              {candidate.description && (
                                <p className="text-sm text-gray-600 mb-3">{candidate.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                  <span className="font-medium text-primary-600">{candidate.votes || 0}</span> votes
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No candidates found */}
                  {filteredCandidates.length === 0 && (
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center">
                      <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Found</h3>
                      <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredCandidates.length}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            {!votingComplete && !hasVoted && (
              <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-white">
                <div className="text-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleVote}
                    disabled={!selectedCandidates.male || !selectedCandidates.female}
                    className="px-8"
                  >
                    Cast Vote
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vote Modal */}
      <FormModal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        onSubmit={handleVoteSubmit}
        title="Cast Your Vote"
        fields={voteFormFields}
        initialData={voterInfo}
        loading={false}
        isUpdate={false}
      />
    </>
  );
};

export default VotingModal;