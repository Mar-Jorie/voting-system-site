// Dashboard Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, UserGroupIcon, TrophyIcon, CheckCircleIcon, PlusIcon, ArrowDownTrayIcon, XMarkIcon, ClockIcon, StopIcon, PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { DashboardSkeleton, ProgressiveLoader } from '../components/SkeletonLoader';
import LazyImage from '../components/LazyImage';
import { useOptimizedDashboardData } from '../hooks/useOptimizedData';
import { toast } from 'react-hot-toast';
import { getVotingStatusInfo, stopVoting, startVoting, setAutoStopDate, formatTimeRemaining, VOTE_STATUS, getResultsVisibility, setResultsVisibility, RESULTS_VISIBILITY } from '../utils/voteControl';
import apiClient from '../usecases/api';
import auditLogger from '../utils/auditLogger.js';
import { generateTablePDF } from '../utils/pdfGenerator.js';

const DashboardPage = () => {
  // Use optimized data loading
  const {
    metrics,
    candidates,
    votes,
    auditLogs,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    refresh
  } = useOptimizedDashboardData();

  const [resultsVisibility, setResultsVisibilityState] = useState(RESULTS_VISIBILITY.HIDDEN);

  // Note: Real-time event listeners are now handled in the useOptimizedDashboardData hook

  // Load voting status
  useEffect(() => {
    const loadVotingStatus = async () => {
      const status = await getVotingStatusInfo();
      setVotingStatus(status);
    };

    loadVotingStatus();
    
    // Update voting status every minute to check for auto-stop
    const interval = setInterval(loadVotingStatus, 60000);
    
    // Listen for real-time voting status changes
    const handleVotingStatusChanged = () => {
      loadVotingStatus();
    };
    
    // Listen for detailed voting status updates
    const handleVotingStatusUpdated = (event) => {
    };
    
    window.addEventListener('votingStatusChanged', handleVotingStatusChanged);
    window.addEventListener('votingStatusUpdated', handleVotingStatusUpdated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('votingStatusChanged', handleVotingStatusChanged);
      window.removeEventListener('votingStatusUpdated', handleVotingStatusUpdated);
    };
  }, []);

  // Load results visibility
  useEffect(() => {
    const loadResultsVisibility = async () => {
      const visibility = await getResultsVisibility();
      setResultsVisibilityState(visibility);
    };

    loadResultsVisibility();
    
    // Listen for results visibility changes
    const handleResultsVisibilityChanged = () => {
      loadResultsVisibility();
    };
    
    window.addEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
    
    return () => {
      window.removeEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
    };
  }, []);


  // Helper function to get display name and blur class for candidate names
  const getDisplayName = (candidate) => {
    return candidate.name;
  };

  const getBlurClass = () => {
    return resultsVisibility === RESULTS_VISIBILITY.PUBLIC ? '' : 'blur-sm';
  };

  const getCandidateVotes = (candidateId, category) => {
    let voteCount = 0;
    
    votes.forEach(vote => {
      if (vote.vote_type === 'dual_selection') {
        // Check if this candidate is selected as male or female
        if ((category === 'male' && vote.male_candidate_id === candidateId) ||
            (category === 'female' && vote.female_candidate_id === candidateId)) {
          voteCount++;
        }
      } else if (vote.candidate_id === candidateId && vote.category === category) {
        // Handle legacy votes (if any exist)
        voteCount++;
      }
    });
    
    return voteCount;
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
    setShowFormModal(true);
  };

  const handleViewResults = () => {
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [votingStatus, setVotingStatus] = useState(null);
  
  // Debug votingStatus changes
  useEffect(() => {
    if (votingStatus) {
    }
  }, [votingStatus]);
  const [showVoteControlModal, setShowVoteControlModal] = useState(false);
  const [showStopConfirmationModal, setShowStopConfirmationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Loading states for voting control buttons
  const [votingControlLoading, setVotingControlLoading] = useState(false);
  const [resultsVisibilityLoading, setResultsVisibilityLoading] = useState(false);
  const [autoStopLoading, setAutoStopLoading] = useState(false);
  
  // FormModal state for adding candidates
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleExportData = () => {
    setShowExportModal(true);
  };

  // Form submission handlers for candidate creation
  const handleFormSubmit = async (formData) => {
    // Store form data and show confirmation modal
    setPendingFormData(formData);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingFormData) return;

    try {
      setSaveLoading(true);
      
      // Create candidate object
      const candidateData = {
        name: pendingFormData.name,
        category: pendingFormData.category,
        description: pendingFormData.description || '',
        images: pendingFormData.images || []
      };

      // Create candidate via API
      await apiClient.createObject('candidates', candidateData);
      
      // Log the creation
      await auditLogger.log({
        action: 'candidate_created',
        entity_type: 'candidate',
        entity_name: candidateData.name,
        details: {
          category: candidateData.category,
          description: candidateData.description,
          images_count: candidateData.images.length
        },
        category: 'candidate_management',
        severity: 'info'
      });

      toast.success('Candidate created successfully');

      // Refresh dashboard data to show updated metrics
      await refresh();
      
      // Dispatch event to notify other components (like candidates page) of the update
      window.dispatchEvent(new CustomEvent('candidatesUpdated'));
      
      setShowFormModal(false);
      setShowConfirmModal(false);
      setPendingFormData(null);
    } catch (error) {
      // Error creating candidate - handled silently
      toast.error('Failed to create candidate');
      setShowConfirmModal(false);
      setPendingFormData(null);
    } finally {
      setSaveLoading(false);
    }
  };

  // Vote Control Functions
  const handleStopVoting = () => {
    // Check if auto-stop is scheduled
    if (votingStatus && votingStatus.autoStopDate) {
      setShowStopConfirmationModal(true);
    } else {
      confirmStopVoting();
    }
  };

  const confirmStopVoting = async () => {
    setVotingControlLoading(true);
    try {
      if (await stopVoting('admin', 'Manually stopped by administrator', true)) {
        // Log voting stop operation
        await auditLogger.log({
          action: 'voting_stopped',
          entity_type: 'system',
          entity_name: 'Voting System',
          details: {
            reason: 'Manually stopped by administrator',
            auto_stop_cleared: true
          },
          category: 'voting',
          severity: 'warning'
        });
        
        setVotingStatus(await getVotingStatusInfo());
        setShowStopConfirmationModal(false);
        toast.success('Voting has been stopped and auto-stop schedule cleared');
      } else {
        toast.error('Failed to stop voting');
      }
    } finally {
      setVotingControlLoading(false);
    }
  };

  const handleStartVoting = async () => {
    setVotingControlLoading(true);
    try {
      if (await startVoting()) {
        // Log voting start operation
        await auditLogger.log({
          action: 'voting_started',
          entity_type: 'system',
          entity_name: 'Voting System',
          details: {
            reason: 'Manually started by administrator'
          },
          category: 'voting',
          severity: 'info'
        });
        
        // Force refresh the voting status immediately
        const newStatus = await getVotingStatusInfo();
        setVotingStatus(newStatus);
        
        toast.success('Voting has been resumed');
        
        // Also dispatch the event to notify other components
        window.dispatchEvent(new CustomEvent('votingStatusChanged'));
      } else {
        toast.error('Failed to start voting');
      }
    } catch (error) {
      console.error('❌ DashboardPage: Error starting voting:', error);
      toast.error(`Failed to start voting: ${error.message}`);
    } finally {
      setVotingControlLoading(false);
    }
  };

  const handleSetAutoStop = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    const stopDateTime = new Date(`${selectedDate}T${selectedTime}`);
    if (stopDateTime <= new Date()) {
      toast.error('Auto-stop date must be in the future');
      return;
    }

    setAutoStopLoading(true);
    try {
      if (await setAutoStopDate(stopDateTime)) {
        // Log auto-stop operation
        await auditLogger.log({
          action: 'auto_stop_set',
          entity_type: 'system',
          entity_name: 'Voting System',
          details: {
            stop_date: stopDateTime.toISOString(),
            stop_date_formatted: stopDateTime.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: '2-digit' 
            }),
            stop_time_formatted: stopDateTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          },
          category: 'voting',
          severity: 'info'
        });
        
        setVotingStatus(await getVotingStatusInfo());
        setShowVoteControlModal(false);
        setSelectedDate('');
        setSelectedTime('');
        toast.success(`Auto-stop set for ${stopDateTime.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: '2-digit' 
        })} at ${stopDateTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`);
      } else {
        toast.error('Failed to set auto-stop date');
      }
    } finally {
      setAutoStopLoading(false);
    }
  };

  const handleShowResults = async () => {
    setResultsVisibilityLoading(true);
    try {
      if (await setResultsVisibility(RESULTS_VISIBILITY.PUBLIC)) {
        // Log results visibility change
        await auditLogger.log({
          action: 'results_shown',
          entity_type: 'system',
          entity_name: 'Election Results',
          details: {
            visibility: 'public'
          },
          category: 'voting',
          severity: 'info'
        });
        
        setResultsVisibilityState(RESULTS_VISIBILITY.PUBLIC);
        toast.success('Results are now publicly visible');
      } else {
        toast.error('Failed to show results');
      }
    } finally {
      setResultsVisibilityLoading(false);
    }
  };

  const handleHideResults = async () => {
    setResultsVisibilityLoading(true);
    try {
      if (await setResultsVisibility(RESULTS_VISIBILITY.HIDDEN)) {
        // Log results visibility change
        await auditLogger.log({
          action: 'results_hidden',
          entity_type: 'system',
          entity_name: 'Election Results',
          details: {
            visibility: 'hidden'
          },
          category: 'voting',
          severity: 'info'
        });
        
        setResultsVisibilityState(RESULTS_VISIBILITY.HIDDEN);
        toast.success('Results are now hidden from public view');
      } else {
        toast.error('Failed to hide results');
      }
    } finally {
      setResultsVisibilityLoading(false);
    }
  };

  // Export functions
  const exportAsCSV = async () => {
    try {
      // Use state data instead of localStorage
      const currentVotes = votes;
      const currentCandidates = candidates;
      
      // Calculate results
      const candidateVotes = {};
      currentVotes.forEach(vote => {
        // Count votes by candidate_id and category
        if (vote.candidate_id) {
          const key = `${vote.candidate_id}_${vote.category}`;
          candidateVotes[key] = (candidateVotes[key] || 0) + 1;
        }
      });
      
      // Create results summary
      const results = currentCandidates.map(candidate => {
        const maleVotes = candidateVotes[`${candidate.id}_male`] || 0;
        const femaleVotes = candidateVotes[`${candidate.id}_female`] || 0;
        return {
          ...candidate,
          maleVotes,
          femaleVotes,
          totalVotes: maleVotes + femaleVotes
        };
      }).sort((a, b) => b.totalVotes - a.totalVotes);
      
    // Separate male and female results
    const maleResults = results.filter(c => c.category === 'male').sort((a, b) => b.maleVotes - a.maleVotes);
    const femaleResults = results.filter(c => c.category === 'female').sort((a, b) => b.femaleVotes - a.femaleVotes);
      
      // Find winners
      const overallWinner = results[0];
      const maleWinner = maleResults[0] || { name: 'No male candidates', party: 'N/A', category: 'male', maleVotes: 0 };
      const femaleWinner = femaleResults[0] || { name: 'No female candidates', party: 'N/A', category: 'female', femaleVotes: 0 };
      
      // Create CSV content with results summary
      const csvContent = [
        // Header
        'ELECTION RESULTS SUMMARY',
        `Generated: ${new Date().toLocaleDateString()}`,
        `Total Votes: ${currentVotes.length}`,
        `Total Candidates: ${currentCandidates.length}`,
        '',
        
        // Winners
        'WINNERS',
        'Category,Name,Party,Gender,Votes,Percentage',
        `"Male Winner","${maleWinner.name}","${maleWinner.party || 'Independent'}","${maleWinner.category}","${maleWinner.maleVotes}","${currentVotes.length > 0 ? ((maleWinner.maleVotes / currentVotes.length) * 100).toFixed(1) : 0}%"`,
        `"Female Winner","${femaleWinner.name}","${femaleWinner.party || 'Independent'}","${femaleWinner.category}","${femaleWinner.femaleVotes}","${currentVotes.length > 0 ? ((femaleWinner.femaleVotes / currentVotes.length) * 100).toFixed(1) : 0}%"`,
        '',
        
        // Male Results (Ranked)
        'MALE CANDIDATES RANKED',
        'Rank,Name,Party,Votes,Percentage',
        ...maleResults.map((candidate, index) => [
          index + 1,
          `"${candidate.name}"`,
          `"${candidate.party || 'Independent'}"`,
          candidate.maleVotes,
          `"${currentVotes.length > 0 ? ((candidate.maleVotes / currentVotes.length) * 100).toFixed(1) : 0}%"`
        ].join(',')),
        '',
        
        // Female Results (Ranked)
        'FEMALE CANDIDATES RANKED',
        'Rank,Name,Party,Votes,Percentage',
        ...femaleResults.map((candidate, index) => [
          index + 1,
          `"${candidate.name}"`,
          `"${candidate.party || 'Independent'}"`,
          candidate.femaleVotes,
          `"${currentVotes.length > 0 ? ((candidate.femaleVotes / currentVotes.length) * 100).toFixed(1) : 0}%"`
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
      
      // Log export operation
      await auditLogger.log({
        action: 'export_data',
        entity_type: 'system',
        entity_name: 'Election Results',
        details: {
          format: 'CSV',
          record_count: currentVotes.length,
          candidate_count: currentCandidates.length
        },
        category: 'export_import',
        severity: 'info'
      });
      
      setShowExportModal(false);
      toast.success('Election results exported as CSV successfully');
    } catch (error) {
      // Error exporting results - handled silently
      toast.error('Failed to export results');
    }
  };

  const exportAsPDF = async () => {
    try {
      // Use state data instead of localStorage
      const currentVotes = votes;
      const currentCandidates = candidates;
      
      if (currentCandidates.length === 0) {
        toast.error('No candidates found to export');
        return;
      }
      
      // Calculate results
      const candidateVotes = {};
      currentVotes.forEach(vote => {
        // Count votes by candidate_id and category
        if (vote.candidate_id) {
          const key = `${vote.candidate_id}_${vote.category}`;
          candidateVotes[key] = (candidateVotes[key] || 0) + 1;
        }
      });
    
      // Create results summary
      const results = currentCandidates.map(candidate => {
        const maleVotes = candidateVotes[`${candidate.id}_male`] || 0;
        const femaleVotes = candidateVotes[`${candidate.id}_female`] || 0;
        return {
          ...candidate,
          maleVotes,
          femaleVotes,
          totalVotes: maleVotes + femaleVotes
        };
      }).sort((a, b) => b.totalVotes - a.totalVotes);
      
      // Separate male and female results
      const maleResults = results.filter(c => c.category === 'male').sort((a, b) => b.maleVotes - a.maleVotes);
      const femaleResults = results.filter(c => c.category === 'female').sort((a, b) => b.femaleVotes - a.femaleVotes);
      
      // Find winners
      const overallWinner = results[0];
      const maleWinner = maleResults[0] || { name: 'No male candidates', party: 'N/A', category: 'male', maleVotes: 0 };
      const femaleWinner = femaleResults[0] || { name: 'No female candidates', party: 'N/A', category: 'female', femaleVotes: 0 };
      
      // Close the export modal first
      setShowExportModal(false);
      
      // Create custom HTML content for election results
      const resultsHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: white; color: black;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">ELECTION RESULTS SUMMARY</h1>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Total Votes: ${currentVotes.length} | Total Candidates: ${currentCandidates.length}</p>
          </div>
          
          <!-- Winners -->
          <div style="margin-bottom: 30px; padding: 20px; background-color: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px;">
            <h2 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">WINNERS</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <!-- Male Winner -->
              <div style="padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Male Winner</h3>
                <h4 style="color: #2563eb; margin: 0 0 5px 0; font-size: 18px; font-weight: bold;">${maleWinner.name}</h4>
                <p style="color: #666; margin: 0 0 5px 0; font-size: 12px;">${maleWinner.party || 'Independent'}</p>
                <p style="color: #2563eb; margin: 0; font-size: 16px; font-weight: bold;">${maleWinner.maleVotes} votes (${currentVotes.length > 0 ? ((maleWinner.maleVotes / currentVotes.length) * 100).toFixed(1) : 0}%)</p>
              </div>
              <!-- Female Winner -->
              <div style="padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Female Winner</h3>
                <h4 style="color: #2563eb; margin: 0 0 5px 0; font-size: 18px; font-weight: bold;">${femaleWinner.name}</h4>
                <p style="color: #666; margin: 0 0 5px 0; font-size: 12px;">${femaleWinner.party || 'Independent'}</p>
                <p style="color: #2563eb; margin: 0; font-size: 16px; font-weight: bold;">${femaleWinner.femaleVotes} votes (${currentVotes.length > 0 ? ((femaleWinner.femaleVotes / currentVotes.length) * 100).toFixed(1) : 0}%)</p>
              </div>
            </div>
          </div>
          
          <!-- Male Results -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2563eb; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">MALE CANDIDATES RANKED</h2>
            <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Rank</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Name</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Party</th>
                  <th style="padding: 8px; text-align: center; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Votes</th>
                  <th style="padding: 8px; text-align: center; font-weight: bold; color: #374151;">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${maleResults.map((candidate, index) => `
                  <tr style="border-bottom: 1px solid #e2e8f0; ${index === 0 ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 8px; color: #6b7280; border-right: 1px solid #e2e8f0; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 8px; color: #374151; font-weight: 500; border-right: 1px solid #e2e8f0;">${candidate.name}</td>
                    <td style="padding: 8px; color: #6b7280; border-right: 1px solid #e2e8f0;">${candidate.party || 'Independent'}</td>
                    <td style="padding: 8px; color: #6b7280; border-right: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${candidate.maleVotes}</td>
                    <td style="padding: 8px; color: #6b7280; text-align: center;">${currentVotes.length > 0 ? ((candidate.maleVotes / currentVotes.length) * 100).toFixed(1) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Female Results -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2563eb; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">FEMALE CANDIDATES RANKED</h2>
            <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Rank</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Name</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Party</th>
                  <th style="padding: 8px; text-align: center; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Votes</th>
                  <th style="padding: 8px; text-align: center; font-weight: bold; color: #374151;">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${femaleResults.map((candidate, index) => `
                  <tr style="border-bottom: 1px solid #e2e8f0; ${index === 0 ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 8px; color: #6b7280; border-right: 1px solid #e2e8f0; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 8px; color: #374151; font-weight: 500; border-right: 1px solid #e2e8f0;">${candidate.name}</td>
                    <td style="padding: 8px; color: #6b7280; border-right: 1px solid #e2e8f0;">${candidate.party || 'Independent'}</td>
                    <td style="padding: 8px; color: #6b7280; border-right: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${candidate.femaleVotes}</td>
                    <td style="padding: 8px; color: #6b7280; text-align: center;">${currentVotes.length > 0 ? ((candidate.femaleVotes / currentVotes.length) * 100).toFixed(1) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <p>This report was generated from the Voting System Admin Panel</p>
          </div>
        </div>
      `;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `election-results-${timestamp}.pdf`;
      
      // Generate PDF using the utility with custom HTML
      const { generatePDF } = await import('../utils/pdfGenerator.js');
      await generatePDF(resultsHTML, filename, {
        title: 'Election Results Summary',
        subtitle: `Total Votes: ${currentVotes.length} | Total Candidates: ${currentCandidates.length}`
      });
      
      // Log export operation
      await auditLogger.log({
        action: 'export_data',
        entity_type: 'system',
        entity_name: 'Election Results',
        details: {
          format: 'PDF',
          record_count: currentVotes.length,
          candidate_count: currentCandidates.length
        },
        category: 'export_import',
        severity: 'info'
      });
      
      toast.success('Election results exported as PDF successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF: ' + error.message);
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
            Welcome back, Admin!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your voting system today.
          </p>
        </div>
      </div>

      {/* Progressive Loading with Skeleton */}
      <ProgressiveLoader
        loading={loading}
        error={error}
        skeleton={DashboardSkeleton}
        onRetry={refresh}
      >
        <div className="space-y-6 2xl:space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4 2xl:gap-6">
          {/* Total Voters */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-xs font-medium text-green-800 bg-green-50 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalVoters || 0}</h3>
            <p className="text-sm text-gray-600 mb-2">Total Voters</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Votes cast</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-green-800">Live</span>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalCandidates || 0}</h3>
            <p className="text-sm text-gray-600 mb-2">Total Candidates</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Male & Female</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-blue-800">All</span>
              </div>
            </div>
          </div>

          {/* Total FAQs */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-800 bg-purple-50 px-2 py-1 rounded-full">
                Help
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalFaqs || 0}</h3>
            <p className="text-sm text-gray-600 mb-2">Total FAQs</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Help articles</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-purple-800">Info</span>
              </div>
            </div>
          </div>

          {/* Total Site Visitors */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-orange-800 bg-orange-50 px-2 py-1 rounded-full">
                Traffic
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalSiteVisitors || 0}</h3>
            <p className="text-sm text-gray-600 mb-2">Site Visitors</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Landing page</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-orange-800">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Election Control Panel - 2 Card Design */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Election Controls</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 2xl:gap-8">
            {/* Voting Status Card */}
            {votingStatus && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${votingStatus.isActive ? 'bg-primary-500' : 'bg-red-500'}`}></div>
                    <span className="text-lg font-semibold text-gray-900">Voting Status</span>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    votingStatus.isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {votingStatus.isActive ? 'Voting Open' : 'Stopped'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {/* Voting Control Buttons Row */}
                  <div className="flex space-x-3">
                    {votingStatus.isActive ? (
                      <Button
                        onClick={handleStopVoting}
                        variant="danger"
                        size="md"
                        className="flex-1"
                        disabled={votingControlLoading}
                      >
                        {votingControlLoading ? (
                          <div className="flex items-center justify-center">
                            <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                            Stopping...
                          </div>
                        ) : (
                          <>
                            <StopIcon className="h-5 w-5 mr-2" />
                            Stop Voting
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStartVoting}
                        variant="success"
                        size="md"
                        className="flex-1"
                        disabled={votingControlLoading}
                      >
                        {votingControlLoading ? (
                          <div className="flex items-center justify-center">
                            <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                            Starting...
                          </div>
                        ) : (
                          <>
                            <PlayIcon className="h-5 w-5 mr-2" />
                            Start Voting
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Auto Stop Button - Only show when voting is active */}
                    {votingStatus.isActive && (
                      <Button
                        onClick={() => setShowVoteControlModal(true)}
                        variant="primaryOutline"
                        size="md"
                        className="flex-1"
                      >
                        <ClockIcon className="h-5 w-5 mr-2" />
                        Auto Stop
                      </Button>
                    )}
                  </div>
                  
                  {/* Note Section - Always show to maintain consistent card height */}
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-600">
                      {votingStatus.isActive 
                        ? (votingStatus.autoStopDate 
                            ? `Auto-stop: ${votingStatus.autoStopDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: '2-digit' 
                              })} at ${votingStatus.autoStopDate.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}${votingStatus.timeUntilStop > 0 ? ` (${formatTimeRemaining(votingStatus.timeUntilStop)} remaining)` : ''}`
                            : "Voting is currently active and accepting votes from users"
                          )
                        : "Voting is currently stopped and not accepting new votes"
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Visibility Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${resultsVisibility === RESULTS_VISIBILITY.PUBLIC ? 'bg-primary-500' : 'bg-red-500'}`}></div>
                  <span className="text-lg font-semibold text-gray-900">Results Visibility</span>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  resultsVisibility === RESULTS_VISIBILITY.PUBLIC 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {resultsVisibility === RESULTS_VISIBILITY.PUBLIC ? 'Public' : 'Hidden'}
                </span>
              </div>
              
              <div className="space-y-3">
                {resultsVisibility === RESULTS_VISIBILITY.HIDDEN ? (
                  <Button
                    onClick={handleShowResults}
                    variant="success"
                    size="md"
                    className="w-full"
                    disabled={resultsVisibilityLoading}
                  >
                    {resultsVisibilityLoading ? (
                      <div className="flex items-center justify-center">
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                        Making Public...
                      </div>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Make Results Public
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleHideResults}
                    variant="danger"
                    size="md"
                    className="w-full"
                    disabled={resultsVisibilityLoading}
                  >
                    {resultsVisibilityLoading ? (
                      <div className="flex items-center justify-center">
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                        Hiding...
                      </div>
                    ) : (
                      <>
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        Hide Results
                      </>
                    )}
                  </Button>
                )}
                
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-600">
                    {resultsVisibility === RESULTS_VISIBILITY.HIDDEN 
                      ? "Candidate names are blurred on the landing page"
                      : "Candidate names are visible on the landing page"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Winners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 2xl:gap-8">
          {/* Male Winner */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Male Winner</h3>
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
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{getDisplayName(maleWinner)}</h4>
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
              <h3 className="text-lg font-semibold text-gray-900">Female Winner</h3>
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
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{getDisplayName(femaleWinner)}</h4>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {/* Male Category Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Male Results</h3>
            </div>
            <div className="space-y-4">
              {maleCandidates.length > 0 ? (
                maleCandidates.map((candidate, index) => (
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
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No male candidates yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add candidates to see results here</p>
                </div>
              )}
            </div>
          </div>

          {/* Female Category Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Female Results</h3>
            </div>
            <div className="space-y-4">
              {femaleCandidates.length > 0 ? (
                femaleCandidates.map((candidate, index) => (
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
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No female candidates yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add candidates to see results here</p>
                </div>
              )}
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.length > 0 ? (
              auditLogs.map((log, index) => {
                const getActivityIcon = (action, category) => {
                  switch (action) {
                    case 'login':
                      return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
                    case 'logout':
                      return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
                    case 'create':
                      return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
                    case 'update':
                      return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
                    case 'delete':
                      return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
                    case 'vote_cast':
                      return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>;
                    case 'voting_started':
                      return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
                    case 'voting_stopped':
                      return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
                    case 'results_shown':
                      return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
                    case 'results_hidden':
                      return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
                    case 'export_data':
                      return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
                    default:
                      return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
                  }
                };

                const getActivityText = (log) => {
                  const action = log.action;
                  const entityType = log.entity_type;
                  const entityName = log.entity_name;
                  const userName = log.user_name;

                  switch (action) {
                    case 'login':
                      return `${userName || 'User'} signed in`;
                    case 'logout':
                      return `${userName || 'User'} signed out`;
                    case 'create':
                      return `${userName || 'User'} created ${entityType}${entityName ? ` "${entityName}"` : ''}`;
                    case 'update':
                      return `${userName || 'User'} updated ${entityType}${entityName ? ` "${entityName}"` : ''}`;
                    case 'delete':
                      return `${userName || 'User'} deleted ${entityType}${entityName ? ` "${entityName}"` : ''}`;
                    case 'vote_cast':
                      return `Vote cast for ${entityName || 'candidate'}`;
                    case 'voting_started':
                      return 'Voting started';
                    case 'voting_stopped':
                      return 'Voting stopped';
                    case 'results_shown':
                      return 'Results made public';
                    case 'results_hidden':
                      return 'Results hidden';
                    case 'export_data':
                      return `Data exported (${log.details?.format || 'unknown format'})`;
                    case 'auto_stop_set':
                      return 'Auto-stop date set';
                    default:
                      return `${action} on ${entityType}`;
                  }
                };

                const getActivityTime = (created) => {
                  const now = new Date();
                  const logTime = new Date(created);
                  const diffMs = now - logTime;
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);

                  if (diffMins < 1) return 'Just now';
                  if (diffMins < 60) return `${diffMins}m ago`;
                  if (diffHours < 24) return `${diffHours}h ago`;
                  if (diffDays < 7) return `${diffDays}d ago`;
                  return logTime.toLocaleDateString();
                };

                return (
                  <div key={log.id || index} className="flex items-center space-x-3">
                    {getActivityIcon(log.action, log.category)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{getActivityText(log)}</p>
                      <p className="text-xs text-gray-500">{getActivityTime(log.created)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No activity yet</p>
                <p className="text-sm text-gray-400 mt-1">System activities will appear here</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </ProgressiveLoader>

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

      {/* Vote Control Modal */}
      {showVoteControlModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowVoteControlModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Set Auto-Stop Date
                </h3>
                <button
                  onClick={() => setShowVoteControlModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => setShowVoteControlModal(false)}
                    variant="secondaryOutline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSetAutoStop}
                    variant="primary"
                    className="flex-1"
                    disabled={autoStopLoading}
                  >
                    {autoStopLoading ? (
                      <div className="flex items-center justify-center">
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                        Setting...
                      </div>
                    ) : (
                      'Set Auto-Stop'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stop Confirmation Modal */}
      {showStopConfirmationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowStopConfirmationModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Manual Stop
                </h3>
                <button
                  onClick={() => setShowStopConfirmationModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ClockIcon className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Auto-Stop Scheduled</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    You have an auto-stop scheduled for{' '}
                    {votingStatus.autoStopDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: '2-digit' 
                    })} at{' '}
                    {votingStatus.autoStopDate.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                </div>
                
                <p className="text-sm text-gray-600">
                  If you continue, the auto-stop schedule will be cleared and voting will be stopped immediately.
                </p>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => setShowStopConfirmationModal(false)}
                    variant="secondaryOutline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmStopVoting}
                    variant="danger"
                    className="flex-1"
                  >
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stop Voting
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal for Adding Candidates */}
      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        title="Add New Candidate"
        submitButtonText="Add Candidate"
        isUpdate={false}
        fields={[
          {
            name: 'name',
            label: 'Candidate Name',
            type: 'String',
            placeholder: 'Enter candidate name',
            required: true
          },
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            placeholder: 'Select category',
            required: true,
            options: [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]
          },
          {
            name: 'description',
            label: 'Description',
            type: 'String',
            placeholder: 'Enter candidate description (optional)',
            required: false
          },
          {
            name: 'images',
            label: 'Candidate Images',
            type: 'file',
            placeholder: 'Upload candidate images',
            required: false,
            multiple: true,
            maxFiles: 5,
            maxSize: 5 * 1024 * 1024, // 5MB
            accept: 'image/*',
            showPreview: true,
            previewSize: 'medium'
          }
        ]}
        initialData={{
          name: '',
          category: '',
          description: '',
          images: []
        }}
      />

      {/* Confirmation Modal for Candidate Creation */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Candidate Creation"
        message={`Are you sure you want to create the candidate "${pendingFormData?.name}"?`}
        confirmLabel="Create Candidate"
        cancelLabel="Cancel"
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="info"
        loading={saveLoading}
      />
    </div>
  );
};

export default DashboardPage;
