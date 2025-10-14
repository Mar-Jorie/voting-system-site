import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, UserIcon, ChartBarIcon, ShieldCheckIcon, ClockIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FloatingChatbot from '../components/FloatingChatbot';
import VotingModal from '../components/VotingModal';
import { isVotingActive, getVotingStatusInfo, getResultsVisibility, RESULTS_VISIBILITY } from '../utils/voteControl';

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [votingStatus, setVotingStatus] = useState(null);
  const [resultsVisibility, setResultsVisibility] = useState(RESULTS_VISIBILITY.HIDDEN);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    // Check voting status
    const checkVotingStatus = () => {
      const status = getVotingStatusInfo();
      setVotingStatus(status);
    };

    // Check results visibility
    const checkResultsVisibility = () => {
      const visibility = getResultsVisibility();
      setResultsVisibility(visibility);
    };

    checkVotingStatus();
    checkResultsVisibility();
    
    // Listen for vote updates
    const handleVotesUpdated = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Listen for results visibility changes
    const handleResultsVisibilityChanged = () => {
      checkResultsVisibility();
    };
    
    window.addEventListener('votesUpdated', handleVotesUpdated);
    window.addEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
    
    // Check voting status every minute
    const interval = setInterval(checkVotingStatus, 60000);
    
    return () => {
      window.removeEventListener('votesUpdated', handleVotesUpdated);
      window.removeEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
      clearInterval(interval);
    };
  }, []);

  // Helper function to display candidate names with shaded effect when results are not public
  const getDisplayName = (candidate) => {
    if (resultsVisibility === RESULTS_VISIBILITY.PUBLIC) {
      return candidate.name;
    } else {
      return '███████'; // Shaded effect instead of asterisks
    }
  };

  // Voting data functions (reactive to refreshTrigger)
  const getTotalVotes = () => {
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    return votes.length;
  };

  const getMaleCandidates = () => {
    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    return candidates.filter(c => c.category === 'male').map(candidate => {
      const candidateVotes = votes.filter(vote => 
        vote.maleCandidateId === candidate.id
      ).length;
      return { ...candidate, votes: candidateVotes };
    });
  };

  const getFemaleCandidates = () => {
    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    return candidates.filter(c => c.category === 'female').map(candidate => {
      const candidateVotes = votes.filter(vote => 
        vote.femaleCandidateId === candidate.id
      ).length;
      return { ...candidate, votes: candidateVotes };
    });
  };

  const getMaleWinner = () => {
    const maleCandidates = getMaleCandidates();
    if (maleCandidates.length === 0) return null;
    return maleCandidates.reduce((prev, current) => 
      (prev.votes > current.votes) ? prev : current
    );
  };

  const getFemaleWinner = () => {
    const femaleCandidates = getFemaleCandidates();
    if (femaleCandidates.length === 0) return null;
    return femaleCandidates.reduce((prev, current) => 
      (prev.votes > current.votes) ? prev : current
    );
  };

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
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
              <Button 
                variant="primaryOutline" 
                size="md"
                onClick={() => {
                  if (votingStatus && !votingStatus.isActive) {
                    alert('Voting is currently disabled. Please contact the administrator.');
                    return;
                  }
                  setShowVotingModal(true);
                }}
                disabled={votingStatus && !votingStatus.isActive}
              >
                {votingStatus && !votingStatus.isActive ? 'Voting Disabled' : 'Start Voting'}
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-3">
                  <a href="#features" className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">Features</a>
                  <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">How It Works</a>
                  <a href="#results" className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">Results</a>
                </div>
                
                {/* Mobile CTA Buttons */}
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                  <Button 
                    variant="primaryOutline" 
                    size="md" 
                    className="w-full"
                    onClick={() => {
                      if (votingStatus && !votingStatus.isActive) {
                        alert('Voting is currently disabled. Please contact the administrator.');
                        setIsMobileMenuOpen(false);
                        return;
                      }
                      setShowVotingModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={votingStatus && !votingStatus.isActive}
                  >
                    {votingStatus && !votingStatus.isActive ? 'Voting Disabled' : 'Start Voting'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full">
          <div className="grid lg:grid-cols-2 3xl:grid-cols-3 gap-8 lg:gap-12 3xl:gap-16 items-center">
            <div className="text-left 3xl:col-span-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
                Corporate Party 2025
                <span className="block bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                  Outstanding Guest Awards
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Join us in celebrating our Corporate Party 2025 Outstanding Guest Awards! 🌟 Select one male and one female guest who made the biggest impact during our special event on October 18, 2025 at ICCT Main Campus.
              </p>
              <div className="flex flex-row sm:flex-row items-start space-x-4 sm:space-x-4 mb-6 sm:mb-8">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="!w-auto min-w-[160px]"
                  onClick={() => {
                    if (votingStatus && !votingStatus.isActive) {
                      alert('Voting is currently disabled. Please contact the administrator.');
                      return;
                    }
                    setShowVotingModal(true);
                  }}
                  disabled={votingStatus && !votingStatus.isActive}
                >
                  {votingStatus && !votingStatus.isActive ? 'Voting Disabled' : 'Cast Vote'}
                </Button>
                <a href="#how-it-works">
                  <Button variant="primaryOutline" size="lg" className="!w-auto min-w-[160px]">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative order-last lg:order-last 3xl:col-span-1">
              {/* Hero Illustration */}
              <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <UserIcon className="h-24 w-24 text-primary-600 mx-auto mb-4" />
                  <p className="text-primary-700 font-medium">Vote for Your Candidates</p>
                  <p className="text-primary-700 text-sm"> October 18, 2025 at ICCT Main Campus.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white">
        <div className="w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              Award Selection Features
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-medium">
              Secure, transparent, and user-friendly selection process for our Corporate Party 2025 awards.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-6 sm:gap-8 3xl:gap-12">
            {/* Feature Cards */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Secure Voting</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-center">Your vote is protected with advanced security measures and one-vote-per-email validation.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <ClockIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Quick & Easy</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-center">Cast your vote in just a few clicks with our intuitive and user-friendly interface.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <ChartBarIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Real-time Results</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-center">View live voting results and statistics as votes are cast in real-time.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Fair & Transparent</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-center">Every vote counts equally in our transparent and fair voting process.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-medium">
              Simple steps to cast your vote and make your voice heard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 3xl:grid-cols-3 gap-8 3xl:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Candidates</h3>
              <p className="text-sm text-gray-600">Browse through all candidates in both male and female categories.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select & Vote</h3>
              <p className="text-sm text-gray-600">Choose one candidate from each category and provide your email to vote.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">See Results</h3>
              <p className="text-sm text-gray-600">View real-time vote counts and see how your candidates are performing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white">
        <div className="w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              Current Voting Results
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-medium">
              See how the candidates are performing in real-time.
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 3xl:grid-cols-3 gap-6 3xl:gap-8 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-xs font-medium text-green-800 bg-green-50 px-2 py-1 rounded-full">
                  Live
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{getTotalVotes()}</h3>
              <p className="text-sm text-gray-600">Total Votes Cast</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded-full">
                  Male
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{getMaleCandidates().length}</h3>
              <p className="text-sm text-gray-600">Male Candidates</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-pink-600" />
                </div>
                <span className="text-xs font-medium text-pink-800 bg-pink-50 px-2 py-1 rounded-full">
                  Female
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{getFemaleCandidates().length}</h3>
              <p className="text-sm text-gray-600">Female Candidates</p>
            </div>
          </div>

          {/* Winners */}
          <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-2 gap-6 3xl:gap-12 mb-8">
            {/* Male Winner */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Male Category Winner</h3>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              {getMaleWinner() ? (
                <div className="text-center">
                  {getMaleWinner().image && (
                    <img 
                      src={getMaleWinner().image} 
                      alt={getMaleWinner().name}
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md"
                    />
                  )}
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{getMaleWinner().name}</h4>
                  <p className="text-2xl font-bold text-primary-600 mb-2">{getMaleWinner().votes || 0} votes</p>
                  <p className="text-sm text-gray-600">
                    {getTotalVotes() > 0 ? (((getMaleWinner().votes || 0) / getTotalVotes()) * 100).toFixed(1) : 0}% of total votes
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No votes yet</p>
                </div>
              )}
            </div>

            {/* Female Winner */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Female Category Winner</h3>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              {getFemaleWinner() ? (
                <div className="text-center">
                  {getFemaleWinner().image && (
                    <img 
                      src={getFemaleWinner().image} 
                      alt={getFemaleWinner().name}
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md"
                    />
                  )}
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{getFemaleWinner().name}</h4>
                  <p className="text-2xl font-bold text-primary-600 mb-2">{getFemaleWinner().votes || 0} votes</p>
                  <p className="text-sm text-gray-600">
                    {getTotalVotes() > 0 ? (((getFemaleWinner().votes || 0) / getTotalVotes()) * 100).toFixed(1) : 0}% of total votes
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No votes yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-2 gap-6 3xl:gap-12 mb-8">
            {/* Male Category Results */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                  <UserGroupIcon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Male Category Results</h3>
              </div>
              <div className="space-y-4">
                {getMaleCandidates().sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((candidate, index) => (
                  <div key={candidate.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex-shrink-0">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    {candidate.image && (
                      <img 
                        src={candidate.image} 
                        alt={candidate.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{getDisplayName(candidate)}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${getTotalVotes() > 0 ? ((candidate.votes || 0) / getTotalVotes()) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 min-w-[2rem]">{candidate.votes || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Female Category Results */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                  <UserGroupIcon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Female Category Results</h3>
              </div>
              <div className="space-y-4">
                {getFemaleCandidates().sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((candidate, index) => (
                  <div key={candidate.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex-shrink-0">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    {candidate.image && (
                      <img 
                        src={candidate.image} 
                        alt={candidate.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{getDisplayName(candidate)}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${getTotalVotes() > 0 ? ((candidate.votes || 0) / getTotalVotes()) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 min-w-[2rem]">{candidate.votes || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* View All Results Button */}
          <div className="text-center">
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-gradient-to-r from-primary-400 to-indigo-600 opacity-90">
        <div className="w-full text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 tracking-tight">
            Ready to Select Outstanding Guests?
          </h2>
          <p className="text-base sm:text-lg text-primary-100 mb-8 sm:mb-10 font-medium">
            Choose the male and female guests who made the biggest impact at our Corporate Party 2025 celebration.
          </p>
          <div className="flex flex-row sm:flex-row items-center justify-center space-x-4 sm:space-x-6">
            <Button 
              variant="light" 
              size="lg" 
              className="!w-auto min-w-[160px]"
              onClick={() => {
                if (votingStatus && !votingStatus.isActive) {
                  alert('Voting is currently disabled. Please contact the administrator.');
                  return;
                }
                setShowVotingModal(true);
              }}
              disabled={votingStatus && !votingStatus.isActive}
            >
              {votingStatus && !votingStatus.isActive ? 'Voting Disabled' : 'Vote Now'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-center text-gray-400 py-6 px-4 sm:px-6">
        <p className="text-xs sm:text-sm">
          &copy; 2024 Voting System by Mrj. All rights reserved. | 
          <Link to="/signin" className="text-gray-400 hover:text-gray-300 underline ml-1">
            Admin Login
          </Link>
        </p>
      </footer>

      {/* Floating Elements */}
      <FloatingChatbot />
      
      {/* Voting Modal */}
      <VotingModal 
        isOpen={showVotingModal} 
        onClose={() => setShowVotingModal(false)} 
      />
    </div>
  );
};

export default LandingPage;