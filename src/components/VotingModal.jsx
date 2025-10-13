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

  const handleClose = () => {
    setVotingComplete(false);
    setSelectedCandidates({ male: null, female: null });
    setVoterInfo({ name: '', email: '' });
    setSearchValue('');
    setFilters({});
    setCurrentPage(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={handleClose}></div>
        
        {/* Modal Content */}
        <div className="relative z-50 w-full max-w-6xl max-h-[90vh] overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl flex flex-col">
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
          <div className="flex-1 overflow-y-auto">
            {votingComplete ? (
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Thank you for voting!</h3>
                <p className="text-gray-600 mb-6">
                  Your vote has been successfully recorded. You can view the results on the main page.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Selections:</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Male Category:</span> {selectedCandidates.male?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Female Category:</span> {selectedCandidates.female?.name}
                    </p>
                  </div>
                </div>
                <Button onClick={handleClose} variant="primary" size="lg">
                  Close
                </Button>
              </div>
            ) : (
              <div className="p-6">
                {hasVoted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">You have already voted!</h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for participating. You can view the results on the main page.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Your Previous Vote:</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Male Category:</span> {selectedCandidates.male?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Female Category:</span> {selectedCandidates.female?.name}
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleClose} variant="primary" size="lg">
                      Close
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Search and Filter */}
                    <div className="mb-6">
                      <SearchFilter
                        placeholder="Search candidates..."
                        value={searchValue}
                        onChange={handleSearchChange}
                        onSearch={handleSearchChange}
                        onFilterChange={handleFilterChange}
                        filters={filters}
                        useSelectForSearch={false}
                        statusOptions={[
                          { value: '', label: 'All Categories' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' }
                        ]}
                        getUniqueCompanies={() => []}
                      />
                    </div>

                    {/* Candidates Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                      {/* Male Candidates */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Male Category</h3>
                          <div className="w-16 h-1 bg-primary-600 mx-auto rounded-full"></div>
                        </div>
                        {maleCandidates.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {maleCandidates.map((candidate) => (
                              <div
                                key={candidate.id}
                                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                  selectedCandidates.male?.id === candidate.id
                                    ? 'border-primary-500 bg-primary-50 shadow-lg transform scale-[1.02]'
                                    : 'border-gray-200 hover:border-primary-300 bg-white'
                                }`}
                                onClick={() => handleCandidateSelect(candidate)}
                              >
                                <div className="flex items-center space-x-6">
                                  {/* Candidate Image */}
                                  <div className="relative">
                                    {candidate.image ? (
                                      <img
                                        src={candidate.image}
                                        alt={candidate.name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 border-4 border-white shadow-lg flex items-center justify-center">
                                        <span className="text-2xl font-bold text-primary-600">
                                          {candidate.name.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                    {selectedCandidates.male?.id === candidate.id && (
                                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Candidate Info */}
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{candidate.name}</h4>
                                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{candidate.description}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
                                        {candidate.votes || 0} votes
                                      </span>
                                      {selectedCandidates.male?.id === candidate.id && (
                                        <span className="text-xs font-medium text-primary-600">
                                          Selected
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <UserIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No male candidates found</p>
                          </div>
                        )}
                      </div>

                      {/* Female Candidates */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Female Category</h3>
                          <div className="w-16 h-1 bg-pink-500 mx-auto rounded-full"></div>
                        </div>
                        {femaleCandidates.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {femaleCandidates.map((candidate) => (
                              <div
                                key={candidate.id}
                                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                  selectedCandidates.female?.id === candidate.id
                                    ? 'border-pink-500 bg-pink-50 shadow-lg transform scale-[1.02]'
                                    : 'border-gray-200 hover:border-pink-300 bg-white'
                                }`}
                                onClick={() => handleCandidateSelect(candidate)}
                              >
                                <div className="flex items-center space-x-6">
                                  {/* Candidate Image */}
                                  <div className="relative">
                                    {candidate.image ? (
                                      <img
                                        src={candidate.image}
                                        alt={candidate.name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 border-4 border-white shadow-lg flex items-center justify-center">
                                        <span className="text-2xl font-bold text-pink-600">
                                          {candidate.name.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                    {selectedCandidates.female?.id === candidate.id && (
                                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Candidate Info */}
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{candidate.name}</h4>
                                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{candidate.description}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                                        {candidate.votes || 0} votes
                                      </span>
                                      {selectedCandidates.female?.id === candidate.id && (
                                        <span className="text-xs font-medium text-pink-600">
                                          Selected
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <UserIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No female candidates found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mb-6">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          itemsPerPage={itemsPerPage}
                          totalItems={filteredCandidates.length}
                          showInfo={true}
                        />
                      </div>
                    )}

                  </>
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          {!votingComplete && !hasVoted && (
            <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-white">
              <div className="flex justify-center">
                <Button
                  onClick={handleVote}
                  variant="primary"
                  size="lg"
                  disabled={!selectedCandidates.male || !selectedCandidates.female}
                  className="px-8"
                >
                  Submit Vote
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vote Form Modal */}
      <FormModal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        onSubmit={handleVoteSubmit}
        title="Confirm Your Vote"
        fields={voteFormFields}
        initialData={voterInfo}
        loading={false}
        isUpdate={false}
      />
    </div>
  );
};

export default VotingModal;