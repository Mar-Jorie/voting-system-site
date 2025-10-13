import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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
        <div className="relative z-50 w-full max-w-6xl max-h-[90vh] overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Male Candidates */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Male Category
                        </h3>
                        {maleCandidates.length > 0 ? (
                          maleCandidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                selectedCandidates.male?.id === candidate.id
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleCandidateSelect(candidate)}
                            >
                              <div className="flex items-center space-x-4">
                                {candidate.image && (
                                  <img
                                    src={candidate.image}
                                    alt={candidate.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                                  <p className="text-sm text-gray-600">{candidate.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {candidate.votes || 0} votes
                                  </p>
                                </div>
                                {selectedCandidates.male?.id === candidate.id && (
                                  <CheckCircleIcon className="h-6 w-6 text-primary-600" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No male candidates found</p>
                        )}
                      </div>

                      {/* Female Candidates */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Female Category
                        </h3>
                        {femaleCandidates.length > 0 ? (
                          femaleCandidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                selectedCandidates.female?.id === candidate.id
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleCandidateSelect(candidate)}
                            >
                              <div className="flex items-center space-x-4">
                                {candidate.image && (
                                  <img
                                    src={candidate.image}
                                    alt={candidate.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                                  <p className="text-sm text-gray-600">{candidate.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {candidate.votes || 0} votes
                                  </p>
                                </div>
                                {selectedCandidates.female?.id === candidate.id && (
                                  <CheckCircleIcon className="h-6 w-6 text-primary-600" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No female candidates found</p>
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

                    {/* Vote Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={handleVote}
                        variant="primary"
                        size="lg"
                        disabled={!selectedCandidates.male || !selectedCandidates.female}
                      >
                        Submit Vote
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
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