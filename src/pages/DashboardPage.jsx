// Dashboard Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, UserGroupIcon, TrophyIcon, CheckCircleIcon, PlusIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';

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

  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportData = () => {
    setShowExportModal(true);
  };

  // Export functions
  const exportAsCSV = () => {
    try {
      // Get all votes and candidates data
      const votes = JSON.parse(localStorage.getItem('votes') || '[]');
      const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
      
      // Calculate results
      const candidateVotes = {};
      votes.forEach(vote => {
        candidateVotes[vote.candidateId] = (candidateVotes[vote.candidateId] || 0) + 1;
      });
      
      // Create results summary
      const results = candidates.map(candidate => ({
        ...candidate,
        votes: candidateVotes[candidate.id] || 0
      })).sort((a, b) => b.votes - a.votes);
      
      // Separate male and female results
      const maleResults = results.filter(c => c.gender === 'male').sort((a, b) => b.votes - a.votes);
      const femaleResults = results.filter(c => c.gender === 'female').sort((a, b) => b.votes - a.votes);
      
      // Find winners
      const overallWinner = results[0];
      const maleWinner = maleResults[0];
      const femaleWinner = femaleResults[0];
      
      // Create CSV content with results summary
      const csvContent = [
        // Header
        'ELECTION RESULTS SUMMARY',
        `Generated: ${new Date().toLocaleDateString()}`,
        `Total Votes: ${votes.length}`,
        `Total Candidates: ${candidates.length}`,
        '',
        
        // Winners
        'WINNERS',
        'Category,Name,Party,Gender,Votes,Percentage',
        `"Male Winner","${maleWinner.name}","${maleWinner.party || 'Independent'}","${maleWinner.gender}","${maleWinner.votes}","${((maleWinner.votes / votes.length) * 100).toFixed(1)}%"`,
        `"Female Winner","${femaleWinner.name}","${femaleWinner.party || 'Independent'}","${femaleWinner.gender}","${femaleWinner.votes}","${((femaleWinner.votes / votes.length) * 100).toFixed(1)}%"`,
        '',
        
        // Male Results (Ranked)
        'MALE CANDIDATES RANKED',
        'Rank,Name,Party,Votes,Percentage',
        ...maleResults.map((candidate, index) => [
          index + 1,
          `"${candidate.name}"`,
          `"${candidate.party || 'Independent'}"`,
          candidate.votes,
          `"${((candidate.votes / votes.length) * 100).toFixed(1)}%"`
        ].join(',')),
        '',
        
        // Female Results (Ranked)
        'FEMALE CANDIDATES RANKED',
        'Rank,Name,Party,Votes,Percentage',
        ...femaleResults.map((candidate, index) => [
          index + 1,
          `"${candidate.name}"`,
          `"${candidate.party || 'Independent'}"`,
          candidate.votes,
          `"${((candidate.votes / votes.length) * 100).toFixed(1)}%"`
        ].join(',')),
        ''
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `election-results-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowExportModal(false);
      toast.success('Election results exported as CSV successfully');
    } catch (error) {
      console.error('Error exporting results:', error);
      toast.error('Failed to export results');
    }
  };

  const exportAsPDF = () => {
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    
    // Calculate results
    const candidateVotes = {};
    votes.forEach(vote => {
      candidateVotes[vote.candidateId] = (candidateVotes[vote.candidateId] || 0) + 1;
    });
    
    // Create results summary
    const results = candidates.map(candidate => ({
      ...candidate,
      votes: candidateVotes[candidate.id] || 0
    })).sort((a, b) => b.votes - a.votes);
    
    // Separate male and female results
    const maleResults = results.filter(c => c.gender === 'male').sort((a, b) => b.votes - a.votes);
    const femaleResults = results.filter(c => c.gender === 'female').sort((a, b) => b.votes - a.votes);
    
    // Find winners
    const overallWinner = results[0];
    const maleWinner = maleResults[0];
    const femaleWinner = femaleResults[0];
    
    // Close the export modal first
    setShowExportModal(false);
    
    // Create a print-specific stylesheet
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          margin: 0.5in;
          size: A4;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Create print content with results summary
    const printElement = document.createElement('div');
    printElement.className = 'print-content';
    printElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">ELECTION RESULTS SUMMARY</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Total Votes: ${votes.length} | Total Candidates: ${candidates.length}</p>
        </div>
        
        <!-- Winners -->
        <div style="margin-bottom: 30px; padding: 20px; background-color: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px;">
          <h2 style="color: #2563eb; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">WINNERS</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Male Winner -->
            <div style="padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Male Winner</h3>
              <h4 style="color: #2563eb; margin: 0 0 5px 0; font-size: 20px; font-weight: bold;">${maleWinner.name}</h4>
              <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">${maleWinner.party || 'Independent'}</p>
              <p style="color: #2563eb; margin: 0; font-size: 18px; font-weight: bold;">${maleWinner.votes} votes (${((maleWinner.votes / votes.length) * 100).toFixed(1)}%)</p>
            </div>
            <!-- Female Winner -->
            <div style="padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Female Winner</h3>
              <h4 style="color: #2563eb; margin: 0 0 5px 0; font-size: 20px; font-weight: bold;">${femaleWinner.name}</h4>
              <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">${femaleWinner.party || 'Independent'}</p>
              <p style="color: #2563eb; margin: 0; font-size: 18px; font-weight: bold;">${femaleWinner.votes} votes (${((femaleWinner.votes / votes.length) * 100).toFixed(1)}%)</p>
            </div>
          </div>
        </div>
        
        <!-- Male Results -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">MALE CANDIDATES RANKED</h2>
          <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Rank</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Name</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Party</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Votes</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${maleResults.map((candidate, index) => `
                <tr style="border-bottom: 1px solid #e2e8f0; ${index === 0 ? 'background-color: #fef3c7;' : ''}">
                  <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0; font-weight: bold;">${index + 1}</td>
                  <td style="padding: 12px; color: #374151; font-weight: 500; border-right: 1px solid #e2e8f0;">${candidate.name}</td>
                  <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0;">${candidate.party || 'Independent'}</td>
                  <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${candidate.votes}</td>
                  <td style="padding: 12px; color: #6b7280; text-align: center;">${((candidate.votes / votes.length) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Female Results -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">FEMALE CANDIDATES RANKED</h2>
          <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Rank</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Name</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Party</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Votes</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${femaleResults.map((candidate, index) => `
                <tr style="border-bottom: 1px solid #e2e8f0; ${index === 0 ? 'background-color: #fef3c7;' : ''}">
                  <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0; font-weight: bold;">${index + 1}</td>
                  <td style="padding: 12px; color: #374151; font-weight: 500; border-right: 1px solid #e2e8f0;">${candidate.name}</td>
                  <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0;">${candidate.party || 'Independent'}</td>
                  <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${candidate.votes}</td>
                  <td style="padding: 12px; color: #6b7280; text-align: center;">${((candidate.votes / votes.length) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.body.appendChild(printElement);
    
    // Trigger print
    setTimeout(() => {
      window.print();
      document.body.removeChild(printElement);
      document.head.removeChild(printStyles);
    }, 100);
    
    toast.success('Election results exported as PDF successfully');
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
          { name: 'Add Candidate', icon: 'PlusIcon', action: handleAddCandidate, color: 'bg-primary-600' },
          { name: 'Export Data', icon: 'ArrowDownTrayIcon', action: handleExportData, color: 'bg-blue-600' }
        ]}
      />

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowExportModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Export Election Results
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Choose the format for exporting voting data:
              </p>
              
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={exportAsCSV}
                  className="w-full"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                
                <Button
                  variant="secondaryOutline"
                  size="md"
                  onClick={exportAsPDF}
                  className="w-full"
                >
                  Export as PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
