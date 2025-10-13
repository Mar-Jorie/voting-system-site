// Voting Page - MANDATORY PATTERN
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, XMarkIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import InputFactory from '../components/InputFactory';
import ImageCarousel from '../components/ImageCarousel';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import FloatingChatbot from '../components/FloatingChatbot';

const VotingPage = () => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    loadCandidates();
    checkVotingStatus();
  }, [checkVotingStatus]);

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

  const handleVoterInfoChange = (field, value) => {
    setVoterInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

  if (votingComplete) {
    return (
      <div className="min-h-screen bg-white overflow-y-auto">
        {/* Navigation Header */}
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <img src="/vite.svg" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Voting System</span>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/signin">
                  <Button variant="ghost" size="md" className="!w-auto">Admin Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Vote Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for participating in the voting process. Your vote has been recorded.
            </p>
            <div className="space-y-3">
              <Link to="/results">
                <Button variant="primary" size="md" className="w-full">View Results</Button>
              </Link>
              <Link to="/">
                <Button variant="secondaryOutline" size="md" className="w-full">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
        <FloatingChatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* Navigation Header - Same as Landing Page */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <img src="/vite.svg" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Voting System</span>
            </div>
            
            {/* Navigation Links - Hidden on Mobile */}
            <div className="hidden md:flex items-center space-x-10">
              <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm">Home</Link>
              <Link to="/results" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm">Results</Link>
            </div>
            
            {/* Mobile Hamburger Menu - Right Corner */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px]"
                aria-label="Toggle menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Desktop CTA Buttons - Hidden on Mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/signin">
                <Button variant="ghost" size="md" className="!w-auto">Admin Login</Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-3">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">Home</Link>
                  <Link to="/results" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">Results</Link>
                </div>
                
                {/* Mobile CTA Buttons */}
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                  <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="md" className="w-full">Admin Login</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Page Header */}
        <div className="mb-8">
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
        <div className="mb-6">
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

        <div className="space-y-6">
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

      {/* Floating Elements */}
      <FloatingChatbot />
    </div>
  );
};

export default VotingPage;