// Dashboard Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { ChartBarIcon, CalendarDaysIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalVotes: 0,
    totalCandidates: 0,
    totalVoters: 0,
    activeVoting: 0
  });

  useEffect(() => {
    // Load metrics from localStorage (mock data for now)
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    
    setMetrics({
      totalVotes: votes.length,
      totalCandidates: candidates.length,
      totalVoters: new Set(votes.map(vote => vote.voterEmail)).size,
      activeVoting: votes.filter(vote => {
        const voteDate = new Date(vote.timestamp);
        const today = new Date();
        return voteDate.toDateString() === today.toDateString();
      }).length
    });
  }, []);

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
    <div className="min-h-screen bg-gray-50">
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

        {/* Progress & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-6">
          {/* Voting Progress Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Voting Progress</h3>
              <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Male Category</span>
                  <span className="text-gray-900">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Female Category</span>
                  <span className="text-gray-900">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-6 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Add Candidate</h4>
              <p className="text-sm text-gray-600">Add new candidate to the voting system</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">View Results</h4>
              <p className="text-sm text-gray-600">Check current voting results</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Export Data</h4>
              <p className="text-sm text-gray-600">Export voting data to CSV</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircleIcon className="h-5 w-5 text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">End Voting</h4>
              <p className="text-sm text-gray-600">Close the current voting session</p>
            </button>
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
