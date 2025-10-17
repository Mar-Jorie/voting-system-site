import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, UserIcon, ChartBarIcon, ShieldCheckIcon, ClockIcon, TrophyIcon, UserGroupIcon, XMarkIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FloatingChatbot from '../components/FloatingChatbot';
import FormModal from '../components/FormModal';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import { CandidateCardSkeleton } from '../components/SkeletonLoader';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';
import auditLogger from '../utils/auditLogger.js';
import { getVotingStatusInfo, getResultsVisibility, RESULTS_VISIBILITY } from '../utils/voteControl';
import { getVisitorStats } from '../utils/visitorTracking';

// Custom Image Carousel Component for Voting Page
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
        alt={`${candidateName} - Candidate ${candidateId}`}
        className="w-full h-full object-cover bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleImageClick}
        onError={(e) => {
          // Show placeholder icon instead of broken image
          e.target.style.display = 'none';
          const parent = e.target.parentElement;
          if (!parent.querySelector('.error-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'error-placeholder absolute inset-0 flex items-center justify-center bg-gray-200';
            placeholder.innerHTML = '<svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
            parent.appendChild(placeholder);
          }
        }}
        onLoad={(e) => {
          // Ensure image is properly loaded and visible
          e.target.style.display = 'block';
          e.target.style.opacity = '1';
          // Remove any error placeholder
          const errorPlaceholder = e.target.parentElement.querySelector('.error-placeholder');
          if (errorPlaceholder) {
            errorPlaceholder.remove();
          }
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

const VotingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState({
    male: null,
    female: null
  });
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [voterInfo, setVoterInfo] = useState({
    name: '',
    email: ''
  });
  const [votingComplete, setVotingComplete] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votingStatus, setVotingStatus] = useState(null);
  const [resultsVisibility, setResultsVisibility] = useState(RESULTS_VISIBILITY.HIDDEN);
  const [votes, setVotes] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: ''
  });
  const trackingRef = useRef(false);
  const trackingTimeoutRef = useRef(null);


  // Helper function to get candidate images (same as CandidatesPage)
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
      } else if (img && img.src) {
        // Object with src property
        return img.src;
      }
      return img;
    }).filter(img => img); // Remove any null/undefined values
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };



  // Handle vote modal close
  const handleVoteModalClose = () => {
    setShowVoteModal(false);
  };

  // Search and filter handlers
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearch = () => {
    // Filter candidates based on search value
    const filtered = candidates.filter(candidate => 
      candidate.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      candidate.description.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredCandidates(filtered);
  };


  const cleanupOldPageLoadData = () => {
    try {
      const now = Date.now();
      const oneMinuteAgo = now - (60 * 1000); // 1 minute in milliseconds
      
      // Get all sessionStorage keys
      const keys = Object.keys(sessionStorage);
      
      keys.forEach(key => {
        if (key.startsWith('pageLoadTracked_')) {
          // Extract timestamp from page load tracking key
          const timestamp = parseInt(key.replace('pageLoadTracked_', ''));
          if (timestamp < oneMinuteAgo) {
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      // Silent error handling
    }
  };

  const trackSiteVisitor = async () => {
    try {
      // Prevent duplicate tracking
      if (trackingRef.current) return;
      trackingRef.current = true;

      // Clear any existing timeout
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }

      // Set a timeout to reset tracking flag after 5 seconds
      trackingTimeoutRef.current = setTimeout(() => {
        trackingRef.current = false;
      }, 5000);

      // Check if we've already tracked this page load
      const pageLoadTrackingKey = `pageLoadTracked_${Date.now()}`;
      const hasTrackedThisPageLoad = sessionStorage.getItem(pageLoadTrackingKey);

      if (!hasTrackedThisPageLoad) {
        // Track the page load
        sessionStorage.setItem(pageLoadTrackingKey, 'true');

        // Clean up old page load tracking keys (keep only recent ones)
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('pageLoadTracked_')) {
            const timestamp = parseInt(key.replace('pageLoadTracked_', ''));
            if (Date.now() - timestamp > 60000) { // Remove keys older than 1 minute
              sessionStorage.removeItem(key);
            }
          }
        });

        // Get visitor stats and track
        const stats = await getVisitorStats();
        if (stats) {
          // Use a more robust hashing approach
          const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Track visitor with unique ID
          await apiClient.createObject('visitor_tracking', {
            visitor_id: visitorId,
            page: 'voting',
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            session_id: sessionStorage.getItem('sessionId') || 'unknown'
          });
        }
      }
    } catch (error) {
      // Silent error handling for tracking
      console.error('Visitor tracking error:', error);
    } finally {
      // Clean up tracking data on page unload
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('pageLoadTracked_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load candidates and votes from database
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
          } else {
            // Legacy single vote structure
            if (vote.candidate_id === candidate.id) {
              candidateVotes++;
            }
          }
        });
        
        return {
          ...candidate,
          voteCount: candidateVotes
        };
      });
      
      setCandidates(candidatesWithVotes || []);
      setFilteredCandidates(candidatesWithVotes || []);
      setVotes(votesData || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clean up old page load tracking data (older than 1 minute)
    cleanupOldPageLoadData();
    
    // Track site visitor immediately
    trackSiteVisitor();
    
    // Load data from database
    loadData();
    
    // Check voting status
    const checkVotingStatus = async () => {
      const status = await getVotingStatusInfo();
      setVotingStatus(status);
    };

    // Check results visibility
    const checkResultsVisibility = async () => {
      const visibility = await getResultsVisibility();
      setResultsVisibility(visibility);
    };

    checkVotingStatus();
    checkResultsVisibility();
    
    // Listen for vote updates
    const handleVotesUpdated = () => {
      loadData();
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Listen for results visibility changes
    const handleResultsVisibilityChanged = () => {
      checkResultsVisibility();
    };
    
    // Listen for voting status changes
    const handleVotingStatusChanged = () => {
      checkVotingStatus();
    };
    
    window.addEventListener('votesUpdated', handleVotesUpdated);
    window.addEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
    window.addEventListener('votingStatusChanged', handleVotingStatusChanged);
    
    // Check voting status every minute
    const interval = setInterval(checkVotingStatus, 60000);
    
    return () => {
      window.removeEventListener('votesUpdated', handleVotesUpdated);
      window.removeEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
      window.removeEventListener('votingStatusChanged', handleVotingStatusChanged);
      clearInterval(interval);
      
      // Clean up tracking timeout
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, [refreshTrigger]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply filters
    let filtered = candidates;
    
    if (key === 'category' && value) {
      filtered = candidates.filter(candidate => candidate.category === value);
    }
    
    // Also apply search filter if there's a search value
    if (searchValue) {
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        candidate.description.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    setFilteredCandidates(filtered);
  };

  const handleCandidateSelect = (candidate) => {
    if (candidate.category === 'male') {
      setSelectedCandidates(prev => ({
        ...prev,
        male: prev.male?.id === candidate.id ? null : candidate
      }));
    } else if (candidate.category === 'female') {
      setSelectedCandidates(prev => ({
        ...prev,
        female: prev.female?.id === candidate.id ? null : candidate
      }));
    }
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

  const handleVote = () => {
    if (!selectedCandidates.male || !selectedCandidates.female) {
      toast.error('Please select both male and female candidates');
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
          male_candidate: selectedCandidates.male.name,
          female_candidate: selectedCandidates.female.name,
          voter_email: voterInfo.email,
          voter_name: voterInfo.name,
          timestamp: new Date().toISOString()
        },
        category: 'voting',
        severity: 'info'
      });

      setShowConfirmationModal(false);
      setShowSuccessModal(true);
      setVotingComplete(true);
      setHasVoted(true);
      
      // Reset selections
      setSelectedCandidates({ male: null, female: null });
      setVoterInfo({ name: '', email: '' });
      
      // Refresh data
      loadData();
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('votesUpdated'));
      
      toast.success('Vote cast successfully!');
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote. Please try again.');
    } finally {
      setVoteLoading(false);
    }
  };


  const handleImageClick = (images, candidateName, currentIndex) => {
    setSelectedImage(images);
    setSelectedImageName(candidateName);
    setSelectedImageIndex(currentIndex);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setShowVoteModal(false);
    setShowConfirmationModal(false);
  };

  const handleCloseAllModals = () => {
    setShowVoteModal(false);
    setShowConfirmationModal(false);
    setShowSuccessModal(false);
    setSelectedImage(null);
    setSelectedImageName('');
    setSelectedImageIndex(0);
  };

  const maleCandidates = filteredCandidates.filter(c => c.category === 'male');
  const femaleCandidates = filteredCandidates.filter(c => c.category === 'female');

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* Navigation - Same as Landing Page */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <img src="/voting-system-site/logo.png" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Voting System</span>
            </div>
            
            {/* Navigation Links - Hidden on Mobile */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm">How It Works</a>
              <a href="#results" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm">Results</a>
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
              <Link to="/">
                <Button variant="primaryOutline" size="md" className="!w-auto">Home</Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-3">
                  <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">Features</a>
                  <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">How It Works</a>
                  <a href="#results" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">Results</a>
                </div>
                
                {/* Mobile CTA Buttons */}
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primaryOutline" size="md" className="w-full">Home</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header with Voting Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-4 leading-tight tracking-tight text-left">
                Cast Your Vote
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-4 leading-relaxed text-left">
                Select your preferred candidates for both male and female categories. Make your voice heard in this important election.
              </p>
            </div>
        
          </div>

          {/* Search Component */}
          <div className="mb-6">
            <div className="w-full">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => { setSearchValue(''); handleSearch(); }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

       

          {/* Candidates Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Male Candidates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <span className="h-3 w-3 rounded-full bg-blue-500 mr-3"></span>
                    Male
                  </h3> 
                  <div className="flex items-center space-x-2">
                    <Pagination
                      currentPage={1}
                      totalPages={1}
                      onPageChange={() => {}}
                      itemsPerPage={10}
                      totalItems={maleCandidates.length}
                      showInfo={true}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">Select your preferred male candidate</p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, index) => (
                      <CandidateCardSkeleton key={`male-skeleton-${index}`} />
                    ))}
                  </div>
                ) : maleCandidates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {maleCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className={`border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedCandidates.male?.id === candidate.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCandidateSelect(candidate)}
                      >
                        <CandidateImageCarousel
                          images={getCandidateImages(candidate)}
                          candidateId={candidate.id}
                          candidateName={candidate.name}
                          onImageClick={handleImageClick}
                        />
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{candidate.name}</h4>
                          <p className="text-sm text-gray-600">{candidate.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No male candidates available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Female Candidates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <span className="h-3 w-3 rounded-full bg-purple-500 mr-3"></span>
                    Female
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Pagination
                      currentPage={1}
                      totalPages={1}
                      onPageChange={() => {}}
                      itemsPerPage={10}
                      totalItems={femaleCandidates.length}
                      showInfo={true}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">Select your preferred female candidate</p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, index) => (
                      <CandidateCardSkeleton key={`female-skeleton-${index}`} />
                    ))}
                  </div>
                ) : femaleCandidates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {femaleCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className={`border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedCandidates.female?.id === candidate.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCandidateSelect(candidate)}
                      >
                        <CandidateImageCarousel
                          images={getCandidateImages(candidate)}
                          candidateId={candidate.id}
                          candidateName={candidate.name}
                          onImageClick={handleImageClick}
                        />
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{candidate.name}</h4>
                          <p className="text-sm text-gray-600">{candidate.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No female candidates available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vote Button */}
          <div className="text-center mt-6">
            <div className="p-6">
              <Button
                onClick={handleVote}
                disabled={!selectedCandidates.male || !selectedCandidates.female || !votingStatus?.isActive}
                variant="primary"
                size="lg"
                className="min-w-[200px]"
              >
                {!selectedCandidates.male || !selectedCandidates.female ? (
                  "Select Both Candidates to Vote"
                ) : !votingStatus?.isActive ? (
                  "Voting is Currently Closed"
                ) : (
                  "Submit My Vote"
                )}
              </Button>
              {(!selectedCandidates.male || !selectedCandidates.female) && (
                <p className="text-sm text-gray-500 mt-3">
                  Please select both a male and female candidate to proceed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Same as Landing Page */}
      <footer className="bg-gray-900 text-center text-gray-400 py-6 px-4 sm:px-6">
        <p className="text-xs sm:text-sm">&copy; 2024 Voting System. All rights reserved.</p>
      </footer>

      {/* Floating Elements */}
      <FloatingChatbot />

      {/* Vote Form Modal */}
      <FormModal
        isOpen={showVoteModal}
        onClose={handleVoteModalClose}
        onSubmit={handleVoteSubmit}
        title="Cast Your Vote - Star of the Night"
        fields={voteFormFields}
        initialData={voterInfo}
        loading={false}
        isUpdate={false}
        submitButtonText="Vote"
      />

      {/* Vote Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmVote}
        title="Confirm Your Vote"
        message={`Are you sure you want to vote for ${selectedCandidates.male?.name} (Male) and ${selectedCandidates.female?.name} (Female)? This action cannot be undone.`}
        confirmLabel="Yes, Cast Vote"
        cancelLabel="Cancel"
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="info"
      />

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        onConfirm={handleSuccessClose}
        title="Vote Cast Successfully!"
        message="Thank you for participating in the Star of the Night election. Your vote has been recorded successfully."
        confirmLabel="Confirm"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        variant="success"
        showCancelButton={false}
      />

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={closeImageModal}></div>
            <div className="relative z-50 w-full max-w-4xl p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedImageName}</h3>
                <button
                  onClick={closeImageModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="relative">
                <img
                  src={selectedImage[selectedImageIndex]}
                  alt={selectedImageName}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
                {selectedImage.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {selectedImage.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === selectedImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingPage;
