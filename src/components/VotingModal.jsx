import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import FormModal from './FormModal';
import SearchFilter from './SearchFilter';
import Pagination from './Pagination';
import ConfirmationModal from './ConfirmationModal';
import { CandidateCardSkeleton } from './SkeletonLoader';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';
import auditLogger from '../utils/auditLogger.js';

// Custom Image Carousel Component for Voting Modal
const CandidateImageCarousel = ({ images, candidateId, candidateName, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = (e) => {
    e.stopPropagation(); // Prevent triggering image click
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = (e) => {
    e.stopPropagation(); // Prevent triggering image click
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const handleImageClick = () => {
    if (onImageClick && images && images.length > 0) {
      onImageClick(images, candidateName, currentIndex);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
        <UserIcon className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative h-32 overflow-hidden rounded-t-lg">
      {/* Current Image - Clickable */}
      <img
        src={images[currentIndex]}
        alt={`Candidate ${candidateId}`}
        className="w-full h-full object-contain bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleImageClick}
        onError={(e) => {
          // Prevent infinite retry loops by setting a fallback
          if (e.target.src !== '/api/placeholder/400/300') {
            e.target.src = '/api/placeholder/400/300';
          }
        }}
        onLoad={(e) => {
          // Ensure image is properly loaded
          e.target.style.opacity = '1';
        }}
      />
      
      {/* Navigation Arrows - Only show if more than 1 image */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

const VotingModal = ({ isOpen, onClose }) => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState({
    male: null,
    female: null
  });
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [voterInfo, setVoterInfo] = useState({
    name: '',
    email: ''
  });
  const [votingComplete, setVotingComplete] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  
  // Image preview modal state
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewCurrentIndex, setPreviewCurrentIndex] = useState(0);
  const [previewCandidateName, setPreviewCandidateName] = useState('');
  
  // Filter and pagination state
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 3 per category to show both categories on same page
  
  // Individual category pagination
  const [maleCurrentPage, setMaleCurrentPage] = useState(1);
  const [femaleCurrentPage, setFemaleCurrentPage] = useState(1);

  // Image carousel helpers
  const getCandidateImages = (candidate) => {
    // Support both 'image' (single) and 'images' (array) for backward compatibility
    let images = [];
    
    if (candidate.images && Array.isArray(candidate.images)) {
      images = candidate.images;
    } else if (candidate.image) {
      images = [candidate.image];
    }
    
    // Convert image objects to URLs for display
    return images.map(img => {
      if (typeof img === 'string') {
        // Simple string path
        return img;
      } else if (img && img.dataUrl) {
        // Object with dataUrl property (base64)
        return img.dataUrl;
      } else if (img && img.url) {
        // Object with url property
        return img.url;
      }
      return img; // Fallback
    });
  };

  const loadCandidates = async () => {
    try {
      setCandidatesLoading(true);
      // Fetch candidates and votes from database
      const [candidatesData, votesData] = await Promise.all([
        apiClient.findObjects('candidates', {}),
        apiClient.findObjects('votes', {})
      ]);
      
      // Calculate vote counts for each candidate
      const candidatesWithVotes = candidatesData.map(candidate => {
        let candidateVotes = 0;
        
        // Count votes from the new single vote structure
        votesData.forEach(vote => {
          if (vote.vote_type === 'dual_selection') {
            // Check if this candidate is selected as male or female
            if (vote.male_candidate_id === candidate.id || vote.female_candidate_id === candidate.id) {
              candidateVotes++;
            }
          } else if (vote.candidate_id === candidate.id) {
            // Handle legacy votes (if any exist)
            candidateVotes++;
          }
        });
        
        return { ...candidate, votes: candidateVotes };
      });
      
      setCandidates(candidatesWithVotes);
      setFilteredCandidates(candidatesWithVotes);
    } catch (error) {
      // Error loading candidates - handled silently
      toast.error('Failed to load candidates');
    } finally {
      setCandidatesLoading(false);
    }
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
    setMaleCurrentPage(1); // Reset male pagination when filtering
    setFemaleCurrentPage(1); // Reset female pagination when filtering
  }, [candidates, searchValue, filters]);

  const checkVotingStatus = useCallback(() => {
    // Reset voting status for new voting session
    setHasVoted(false);
    setSelectedCandidates({ male: null, female: null });
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

  // Get candidates by category
  const maleCandidates = filteredCandidates.filter(candidate => candidate.category === 'male');
  const femaleCandidates = filteredCandidates.filter(candidate => candidate.category === 'female');
  
  // Individual pagination for each category
  const candidatesPerPage = 3; // Show 3 candidates per category per page
  const maleTotalPages = Math.ceil(maleCandidates.length / candidatesPerPage);
  const femaleTotalPages = Math.ceil(femaleCandidates.length / candidatesPerPage);
  
  // Get paginated candidates for each category using their own pagination
  const maleStartIndex = (maleCurrentPage - 1) * candidatesPerPage;
  const maleEndIndex = maleStartIndex + candidatesPerPage;
  const paginatedMaleCandidates = maleCandidates.slice(maleStartIndex, maleEndIndex);
  
  const femaleStartIndex = (femaleCurrentPage - 1) * candidatesPerPage;
  const femaleEndIndex = femaleStartIndex + candidatesPerPage;
  const paginatedFemaleCandidates = femaleCandidates.slice(femaleStartIndex, femaleEndIndex);

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

  const handleVoteSubmit = (formData) => {
    // Update voter info with form data
    setVoterInfo(formData);

    // Show confirmation modal instead of directly submitting
    setShowVoteModal(false);
    setShowConfirmationModal(true);
  };

  const handleConfirmVote = async () => {
    setVoteLoading(true);
    try {
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

      // Save single vote to database
      const voteResult = await apiClient.createObject('votes', vote);

      // Log vote casting for the single vote entry
      await auditLogger.log({
        action: 'vote_cast',
        entity_type: 'vote',
        entity_id: voteResult.id,
        entity_name: `${selectedCandidates.male.name} & ${selectedCandidates.female.name}`,
        details: {
          male_candidate_id: selectedCandidates.male.id,
          male_candidate_name: selectedCandidates.male.name,
          female_candidate_id: selectedCandidates.female.id,
          female_candidate_name: selectedCandidates.female.name,
          voter_email: voterInfo.email,
          voter_name: voterInfo.name,
          vote_type: 'dual_selection'
        },
        category: 'voting',
        severity: 'info'
      });

      // Reload candidates with updated vote counts
      await loadCandidates();
      
      // Dispatch custom event to notify other pages of vote update
      window.dispatchEvent(new CustomEvent('votesUpdated'));

      setShowConfirmationModal(false);
      setShowSuccessModal(true);
      
      // Show success toast
      toast.success('Your vote has been submitted successfully!');
    } catch (error) {
      // Error submitting vote - handled silently
      toast.error('Failed to submit vote. Please try again.');
      setShowConfirmationModal(false);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    // Close success modal and voting form modal
    setShowSuccessModal(false);
    setShowVoteModal(false);
    // Reset form for next vote
    setVoterInfo({ name: '', email: '' });
    setSelectedCandidates({ male: null, female: null });
    setVotingComplete(false);
    // Main VotingModal stays open for continued candidate selection
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
    setShowConfirmationModal(false);
    setShowSuccessModal(false);
    setVoterInfo({ name: '', email: '' });
    onClose();
  };

  // Handle image preview
  const handleImageClick = (images, candidateName, currentIndex = 0) => {
    setPreviewImages(images);
    setPreviewCurrentIndex(currentIndex);
    setPreviewCandidateName(candidateName);
    setShowImagePreview(true);
  };

  const handlePreviewClose = () => {
    setShowImagePreview(false);
    setPreviewImages([]);
    setPreviewCurrentIndex(0);
    setPreviewCandidateName('');
  };

  const handlePreviewPrevious = () => {
    setPreviewCurrentIndex(previewCurrentIndex === 0 ? previewImages.length - 1 : previewCurrentIndex - 1);
  };

  const handlePreviewNext = () => {
    setPreviewCurrentIndex(previewCurrentIndex === previewImages.length - 1 ? 0 : previewCurrentIndex + 1);
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
            <div className="flex-1 overflow-y-auto p-6">
              {!votingComplete && (
                <div className="space-y-6">
                  {/* Page Header */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-gray-600">
                        Select one candidate from each category to cast your vote.
                      </p>
                      {/* Global pagination removed - each category has its own pagination */}
                    </div>
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
                      showFilterIcon={false}
                    />
                  </div>

                  {/* Male Category */}
                  {maleCandidates.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-lg font-semibold text-gray-900">Male</h2>
                        </div>
                        {/* Male Category Pagination */}
                        {!candidatesLoading && (
                          <Pagination
                            currentPage={maleCurrentPage}
                            totalPages={maleTotalPages}
                            onPageChange={setMaleCurrentPage}
                            totalItems={maleCandidates.length}
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {candidatesLoading ? (
                          // Show skeleton loaders while loading
                          Array.from({ length: 3 }).map((_, index) => (
                            <CandidateCardSkeleton key={`male-skeleton-${index}`} />
                          ))
                        ) : (
                          paginatedMaleCandidates.map((candidate) => (
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
                            <CandidateImageCarousel 
                              images={getCandidateImages(candidate)} 
                              candidateId={candidate.id}
                              candidateName={candidate.name}
                              onImageClick={handleImageClick}
                            />

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
                        ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Female Category */}
                  {femaleCandidates.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center mr-3">
                            <UserIcon className="h-5 w-5 text-pink-600" />
                          </div>
                          <h2 className="text-lg font-semibold text-gray-900">Female</h2>
                        </div>
                        {/* Female Category Pagination */}
                        {!candidatesLoading && (
                          <Pagination
                            currentPage={femaleCurrentPage}
                            totalPages={femaleTotalPages}
                            onPageChange={setFemaleCurrentPage}
                            totalItems={femaleCandidates.length}
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {candidatesLoading ? (
                          // Show skeleton loaders while loading
                          Array.from({ length: 3 }).map((_, index) => (
                            <CandidateCardSkeleton key={`female-skeleton-${index}`} />
                          ))
                        ) : (
                          paginatedFemaleCandidates.map((candidate) => (
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
                            <CandidateImageCarousel 
                              images={getCandidateImages(candidate)} 
                              candidateId={candidate.id}
                              candidateName={candidate.name}
                              onImageClick={handleImageClick}
                            />

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
                        ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selection Status */}
                  {!candidatesLoading && filteredCandidates.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${selectedCandidates.male ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm font-medium text-gray-700">Male</span>
                            {selectedCandidates.male && (
                              <span className="ml-2 text-sm text-green-600 font-medium">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${selectedCandidates.female ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm font-medium text-gray-700">Female</span>
                            {selectedCandidates.female && (
                              <span className="ml-2 text-sm text-green-600 font-medium">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
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

                </div>
              )}
            </div>

            {/* Fixed Footer */}
            {!votingComplete && !hasVoted && (
              <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-white rounded-b-xl">
                <div className="text-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleVote}
                    disabled={candidatesLoading || !selectedCandidates.male || !selectedCandidates.female}
                    className="px-8 min-w-[200px]"
                  >
                    {candidatesLoading ? 'Loading...' : 'Cast Vote'}
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
        title="Cast Your Vote - Star of the Night"
        fields={voteFormFields}
        initialData={voterInfo}
        loading={false}
        isUpdate={false}
        submitButtonText="Vote"
      />

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 transition-opacity bg-black/80" 
              onClick={handlePreviewClose}
            ></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {previewCandidateName} - Image {previewCurrentIndex + 1} of {previewImages.length}
                </h2>
                <button
                  onClick={handlePreviewClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Image Content */}
              <div className="relative p-6">
                <div className="relative max-h-[70vh] flex items-center justify-center">
                  <img
                    src={previewImages[previewCurrentIndex]}
                    alt={`${previewCandidateName} - Image ${previewCurrentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // Prevent infinite retry loops by setting a fallback
                      if (e.target.src !== '/api/placeholder/400/300') {
                        e.target.src = '/api/placeholder/400/300';
                      }
                    }}
                    onLoad={(e) => {
                      // Ensure image is properly loaded
                      e.target.style.opacity = '1';
                    }}
                  />
                  
                  {/* Navigation Arrows - Only show if more than 1 image */}
                  {previewImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviewPrevious}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-opacity"
                        aria-label="Previous image"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={handlePreviewNext}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-opacity"
                        aria-label="Next image"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Image Indicators */}
                {previewImages.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {previewImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setPreviewCurrentIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === previewCurrentIndex ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
          </div>
          </div>
        </div>
      </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmVote}
        title="Confirm Your Vote"
        message={`Are you sure you want to vote for ${selectedCandidates.male?.name} (Male) and ${selectedCandidates.female?.name} (Female)? This action cannot be undone.`}
        confirmLabel="Yes, Cast My Vote"
        cancelLabel="Cancel"
        loading={voteLoading}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="info"
      />

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessConfirm}
        onConfirm={handleSuccessConfirm}
        title="Vote Submitted Successfully!"
        message="Thank you for participating in the voting process. Your vote has been recorded. You can continue voting or close the modal."
        confirmLabel="Continue Voting"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        variant="success"
        showCancelButton={false}
      />
    </>
  );
};

export default VotingModal;