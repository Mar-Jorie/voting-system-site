// Results Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChartBarIcon, TrophyIcon, UserGroupIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FloatingChatbot from '../components/FloatingChatbot';

const ResultsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [_loading, _setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    const storedVotes = JSON.parse(localStorage.getItem('votes') || '[]');
    setCandidates(storedCandidates);
    setVotes(storedVotes);
  };

  const getCandidateVotes = (candidateId) => {
    return votes.filter(vote => 
      vote.maleCandidateId === candidateId || vote.femaleCandidateId === candidateId
    ).length;
  };

  const getTotalVotes = () => {
    return votes.length;
  };

  const getMaleCandidates = () => {
    return candidates
      .filter(c => c.category === 'male')
      .map(c => ({ ...c, voteCount: getCandidateVotes(c.id) }))
      .sort((a, b) => b.voteCount - a.voteCount);
  };

  const getFemaleCandidates = () => {
    return candidates
      .filter(c => c.category === 'female')
      .map(c => ({ ...c, voteCount: getCandidateVotes(c.id) }))
      .sort((a, b) => b.voteCount - a.voteCount);
  };

  const getWinner = (candidates) => {
    return candidates.length > 0 ? candidates[0] : null;
  };


  const maleCandidates = getMaleCandidates();
  const femaleCandidates = getFemaleCandidates();
  const maleWinner = getWinner(maleCandidates);
  const femaleWinner = getWinner(femaleCandidates);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6">
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
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm">How It Works</a>
              <Link to="/results" className="text-primary-600 hover:text-primary-700 transition-colors duration-200 font-medium text-sm">Results</Link>
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
              <Link to="/voting">
                <Button variant="primaryOutline" size="md">Start Voting</Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-3">
                  <a href="#features" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">Features</a>
                  <a href="#how-it-works" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm py-2">How It Works</a>
                  <Link to="/results" onClick={toggleMobileMenu} className="block text-primary-600 hover:text-primary-700 transition-colors duration-200 font-medium text-sm py-2">Results</Link>
                </div>
                
                {/* Mobile CTA Buttons */}
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                  <Link to="/signin" onClick={toggleMobileMenu}>
                    <Button variant="ghost" size="md" className="w-full">Admin Login</Button>
                  </Link>
                  <Link to="/voting" onClick={toggleMobileMenu}>
                    <Button variant="primaryOutline" size="md" className="w-full">Start Voting</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
            Voting Results
          </h1>
          <p className="text-gray-600">
            Current voting results and statistics.
          </p>
        </div>

        <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{maleCandidates.length}</h3>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{femaleCandidates.length}</h3>
            <p className="text-sm text-gray-600">Female Candidates</p>
          </div>
        </div>

        {/* Winners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Male Winner */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-sm border border-blue-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Male Category Winner</h3>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            {maleWinner ? (
              <div className="text-center">
                {maleWinner.image && (
                  <img 
                    src={maleWinner.image} 
                    alt={maleWinner.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md"
                  />
                )}
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{maleWinner.name}</h4>
                <p className="text-2xl font-bold text-blue-600 mb-2">{maleWinner.voteCount} votes</p>
                <p className="text-sm text-gray-600">
                  {getTotalVotes() > 0 ? ((maleWinner.voteCount / getTotalVotes()) * 100).toFixed(1) : 0}% of total votes
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
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 shadow-sm border border-pink-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Female Category Winner</h3>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            {femaleWinner ? (
              <div className="text-center">
                {femaleWinner.image && (
                  <img 
                    src={femaleWinner.image} 
                    alt={femaleWinner.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md"
                  />
                )}
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{femaleWinner.name}</h4>
                <p className="text-2xl font-bold text-pink-600 mb-2">{femaleWinner.voteCount} votes</p>
                <p className="text-sm text-gray-600">
                  {getTotalVotes() > 0 ? ((femaleWinner.voteCount / getTotalVotes()) * 100).toFixed(1) : 0}% of total votes
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Male Category Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Male Category Results</h3>
            </div>
            <div className="space-y-4">
              {maleCandidates.map((candidate, index) => (
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
                    <p className="font-medium text-gray-900">{candidate.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${getTotalVotes() > 0 ? (candidate.voteCount / getTotalVotes()) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 min-w-[2rem]">{candidate.voteCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Female Category Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center mr-3">
                <UserGroupIcon className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Female Category Results</h3>
            </div>
            <div className="space-y-4">
              {femaleCandidates.map((candidate, index) => (
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
                    <p className="font-medium text-gray-900">{candidate.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-pink-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${getTotalVotes() > 0 ? (candidate.voteCount / getTotalVotes()) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 min-w-[2rem]">{candidate.voteCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Floating Elements */}
      <FloatingChatbot />
    </div>
  );
};

export default ResultsPage;
