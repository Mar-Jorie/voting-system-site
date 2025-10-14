// Dashboard Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, UserGroupIcon, TrophyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalVotes: 0,
    totalCandidates: 0,
    totalVoters: 0,
    activeVoting: 0
  });
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    loadData();
    
    // Listen for vote updates
    const handleVotesUpdated = () => {
      loadData();
    };
    
    window.addEventListener('votesUpdated', handleVotesUpdated);
    
    return () => {
      window.removeEventListener('votesUpdated', handleVotesUpdated);
    };
  }, []);

  const loadData = () => {
    const storedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    const storedVotes = JSON.parse(localStorage.getItem('votes') || '[]');
    setCandidates(storedCandidates);
    setVotes(storedVotes);
    
    setMetrics({
      totalVotes: storedVotes.length,
      totalCandidates: storedCandidates.length,
      totalVoters: new Set(storedVotes.map(vote => vote.voterEmail)).size,
      activeVoting: storedVotes.filter(vote => {
        const voteDate = new Date(vote.timestamp);
        const today = new Date();
        return voteDate.toDateString() === today.toDateString();
      }).length
    });
  };

  const getCandidateVotes = (candidateId, category) => {
    return votes.filter(vote => {
      if (category === 'male') {
        return vote.maleCandidateId === candidateId;
      } else if (category === 'female') {
        return vote.femaleCandidateId === candidateId;
      }
      return false;
    }).length;
  };

  const getTotalVotes = () => {
    return votes.length;
  };

  const getMaleCandidates = () => {
    return candidates
      .filter(c => c.category === 'male')
      .map(c => ({ ...c, voteCount: getCandidateVotes(c.id, 'male') }))
      .sort((a, b) => b.voteCount - a.voteCount);
  };

  const getFemaleCandidates = () => {
    return candidates
      .filter(c => c.category === 'female')
      .map(c => ({ ...c, voteCount: getCandidateVotes(c.id, 'female') }))
      .sort((a, b) => b.voteCount - a.voteCount);
  };

  const getWinner = (candidates) => {
    return candidates.length > 0 ? candidates[0] : null;
  };

  const maleCandidates = getMaleCandidates();
  const femaleCandidates = getFemaleCandidates();
  const maleWinner = getWinner(maleCandidates);
  const femaleWinner = getWinner(femaleCandidates);

  const handleAddCandidate = () => {
    console.log('Add new candidate');
  };

  const handleViewResults = () => {
    console.log('View voting results');
  };

  const handleExportData = () => {
    console.log('Export voting data');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          Welcome back, Admin!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your voting system today.
        </p>
      </div>

      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 3xl:grid-cols-6 gap-4">
          {/* Total Votes */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-xs font-medium text-green-800 bg-green-50 px-2 py-1 rounded-full">
                +12%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalVotes}</h3>
            <p className="text-sm text-gray-600 mb-2">Total Votes</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">From last week</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-green-800">12%</span>
              </div>
            </div>
          </div>

          {/* Total Candidates */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalCandidates}</h3>
            <p className="text-sm text-gray-600 mb-2">Total Candidates</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Currently active</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-blue-800">2</span>
              </div>
            </div>
          </div>

          {/* Total Voters */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-800 bg-green-50 px-2 py-1 rounded-full">
                +8%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalVoters}</h3>
            <p className="text-sm text-gray-600 mb-2">Total Voters</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Unique voters</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-green-800">8%</span>
              </div>
            </div>
          </div>

          {/* Active Voting Today */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-orange-800 bg-orange-50 px-2 py-1 rounded-full">
                Today
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.activeVoting}</h3>
            <p className="text-sm text-gray-600 mb-2">Votes Today</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Last 24 hours</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-orange-800">Live</span>
              </div>
            </div>
          </div>
        </div>


        {/* Winners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-6">
          {/* Male Winner */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-200">
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
                <p className="text-2xl font-bold text-primary-600 mb-2">{maleWinner.voteCount} votes</p>
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
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-200">
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
                <p className="text-2xl font-bold text-primary-600 mb-2">{femaleWinner.voteCount} votes</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-6">
          {/* Male Category Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
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
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
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
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
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
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
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

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-green-800" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New vote cast for Sarah Johnson</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New vote cast for John Smith</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Voting session started</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant="dots"
        icon="EllipsisVerticalIcon"
        label="Toggle quick actions"
        quickActions={[
          { name: 'Add Candidate', icon: 'UserGroupIcon', action: handleAddCandidate, color: 'bg-primary-600' },
          { name: 'View Results', icon: 'ChartBarIcon', action: handleViewResults, color: 'bg-green-600' },
          { name: 'Export Data', icon: 'CalendarDaysIcon', action: handleExportData, color: 'bg-blue-600' }
        ]}
      />
    </div>
  );
};

export default DashboardPage;
