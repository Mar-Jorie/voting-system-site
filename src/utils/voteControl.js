// Vote Control Utility
// Manages voting status (active/stopped) and automatic stop scheduling
// NOW USES DATABASE FOR REAL-TIME SYNCHRONIZATION ACROSS ALL DEVICES

import apiClient from '../usecases/api';

export const VOTE_STATUS = {
  ACTIVE: 'active',
  STOPPED: 'stopped'
};

export const RESULTS_VISIBILITY = {
  HIDDEN: 'hidden',
  PUBLIC: 'public'
};

// Get current vote control settings from database using voting_sessions
export const getVoteControl = async () => {
  try {
    // Get the current voting session
    const sessions = await apiClient.findObjects('voting_sessions', {});
    
    if (sessions && sessions.length > 0) {
      const session = sessions[0]; // Get the first (and should be only) session
      return {
        id: session.id,
        status: session.is_active ? VOTE_STATUS.ACTIVE : VOTE_STATUS.STOPPED,
        autoStopDate: session.end_date ? new Date(session.end_date) : null,
        stoppedAt: session.is_active ? null : new Date(session.updated),
        stoppedBy: session.is_active ? null : 'admin',
        reason: session.is_active ? null : 'Voting session deactivated',
        resultsVisibility: session.results_visibility || RESULTS_VISIBILITY.HIDDEN,
        updatedAt: new Date(session.updated)
      };
    }
    
    // If no session exists, create default one
    const defaultSession = {
      title: 'Corporate Party 2025 - Star of the Night Awards',
      description: 'Voting for outstanding guests at Corporate Party 2025',
      start_date: new Date().toISOString(),
      end_date: null,
      is_active: true
    };
    
    const newSession = await apiClient.createObject('voting_sessions', defaultSession);
    return {
      id: newSession.id,
      status: VOTE_STATUS.ACTIVE,
      autoStopDate: null,
      stoppedAt: null,
      stoppedBy: null,
      reason: null,
      resultsVisibility: RESULTS_VISIBILITY.HIDDEN,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error getting vote control from database:', error);
    // Fallback to default values
    return {
      id: null,
      status: VOTE_STATUS.ACTIVE,
      autoStopDate: null,
      stoppedAt: null,
      stoppedBy: null,
      reason: null,
      resultsVisibility: RESULTS_VISIBILITY.HIDDEN,
      updatedAt: new Date()
    };
  }
};

// Set vote control settings in database using voting_sessions
export const setVoteControl = async (control) => {
  try {
    console.log('🔄 setVoteControl: Starting with control:', control);
    
    if (control.id) {
      // Update existing voting session
      const updateData = {
        is_active: control.status === VOTE_STATUS.ACTIVE,
        end_date: control.autoStopDate ? control.autoStopDate.toISOString() : null,
        results_visibility: control.resultsVisibility || RESULTS_VISIBILITY.HIDDEN
      };
      
      console.log('🔄 setVoteControl: Updating with data:', updateData);
      const result = await apiClient.updateObject('voting_sessions', control.id, updateData);
      console.log('🔄 setVoteControl: Update result:', result);
      
      if (!result) {
        throw new Error('Failed to update voting session');
      }
    } else {
      // Create new voting session
      const createData = {
        title: 'Corporate Party 2025 - Star of the Night Awards',
        description: 'Voting for outstanding guests at Corporate Party 2025',
        start_date: new Date().toISOString(),
        end_date: control.autoStopDate ? control.autoStopDate.toISOString() : null,
        is_active: control.status === VOTE_STATUS.ACTIVE,
        results_visibility: control.resultsVisibility || RESULTS_VISIBILITY.HIDDEN
      };
      
      console.log('🔄 setVoteControl: Creating with data:', createData);
      const result = await apiClient.createObject('voting_sessions', createData);
      console.log('🔄 setVoteControl: Create result:', result);
      
      if (!result) {
        throw new Error('Failed to create voting session');
      }
    }
    
    // Dispatch event to notify all devices of the change
    console.log('🔄 setVoteControl: Dispatching votingStatusChanged event');
    window.dispatchEvent(new CustomEvent('votingStatusChanged'));
    
    return true;
  } catch (error) {
    console.error('❌ setVoteControl: Error setting vote control in database:', error);
    // Show error toast to user if available
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.error(`Failed to update voting status: ${error.message}`);
    }
    return false;
  }
};

// Check if voting is currently active (async version)
export const isVotingActive = async () => {
  const control = await getVoteControl();
  
  // If manually stopped, voting is not active
  if (control.status === VOTE_STATUS.STOPPED) {
    return false;
  }
  
  // Check if auto-stop date has passed
  if (control.autoStopDate && new Date() >= control.autoStopDate) {
    // Auto-stop voting by updating the session
    await setVoteControl({
      ...control,
      status: VOTE_STATUS.STOPPED,
      stoppedAt: new Date(),
      stoppedBy: 'system',
      reason: 'Automatic stop date reached'
    });
    return false;
  }
  
  return true;
};

// Manually stop voting (async version)
export const stopVoting = async (stoppedBy = 'admin', reason = 'Manually stopped by administrator', clearAutoStop = false) => {
  const control = await getVoteControl();
  return await setVoteControl({
    ...control,
    status: VOTE_STATUS.STOPPED,
    stoppedAt: new Date(),
    stoppedBy,
    reason,
    autoStopDate: clearAutoStop ? null : control.autoStopDate
  });
};

// Start voting (resume) (async version)
export const startVoting = async () => {
  console.log('🔄 startVoting: Getting current control...');
  const control = await getVoteControl();
  console.log('🔄 startVoting: Current control:', control);
  
  const newControl = {
    ...control,
    status: VOTE_STATUS.ACTIVE,
    stoppedAt: null,
    stoppedBy: null,
    reason: null
  };
  console.log('🔄 startVoting: Setting new control:', newControl);
  
  const result = await setVoteControl(newControl);
  console.log('🔄 startVoting: setVoteControl result:', result);
  
  return result;
};

// Set automatic stop date (async version)
export const setAutoStopDate = async (date) => {
  const control = await getVoteControl();
  return await setVoteControl({
    ...control,
    autoStopDate: date
  });
};

// Get voting status info for display (async version)
export const getVotingStatusInfo = async () => {
  console.log('🔄 getVotingStatusInfo: Getting control...');
  const control = await getVoteControl();
  console.log('🔄 getVotingStatusInfo: Control:', control);
  
  const isActive = await isVotingActive();
  console.log('🔄 getVotingStatusInfo: isActive:', isActive);
  
  const statusInfo = {
    isActive,
    status: control.status,
    autoStopDate: control.autoStopDate,
    stoppedAt: control.stoppedAt,
    stoppedBy: control.stoppedBy,
    reason: control.reason,
    timeUntilStop: control.autoStopDate ? Math.max(0, control.autoStopDate.getTime() - new Date().getTime()) : null
  };
  
  console.log('🔄 getVotingStatusInfo: Returning status info:', statusInfo);
  return statusInfo;
};

// Format time remaining until auto-stop
export const formatTimeRemaining = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return null;
  
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

// Results Visibility Functions (now using database)
export const getResultsVisibility = async () => {
  try {
    const control = await getVoteControl();
    return control.resultsVisibility || RESULTS_VISIBILITY.HIDDEN;
  } catch (error) {
    console.error('Error getting results visibility:', error);
    return RESULTS_VISIBILITY.HIDDEN;
  }
};

export const setResultsVisibility = async (visibility) => {
  try {
    const control = await getVoteControl();
    await setVoteControl({
      ...control,
      resultsVisibility: visibility
    });
    
    // Dispatch event to notify all devices
    window.dispatchEvent(new CustomEvent('resultsVisibilityChanged'));
    return true;
  } catch (error) {
    console.error('Error setting results visibility:', error);
    return false;
  }
};

export const isResultsPublic = async () => {
  const visibility = await getResultsVisibility();
  return visibility === RESULTS_VISIBILITY.PUBLIC;
};

export const hideResults = async () => {
  return await setResultsVisibility(RESULTS_VISIBILITY.HIDDEN);
};

export const showResults = async () => {
  return await setResultsVisibility(RESULTS_VISIBILITY.PUBLIC);
};

// Real-time synchronization functions
export const startVotingStatusSync = (callback) => {
  // Listen for voting status changes
  const handleVotingStatusChanged = () => {
    if (callback) {
      callback();
    }
  };
  
  window.addEventListener('votingStatusChanged', handleVotingStatusChanged);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('votingStatusChanged', handleVotingStatusChanged);
  };
};

export const startResultsVisibilitySync = (callback) => {
  // Listen for results visibility changes
  const handleResultsVisibilityChanged = () => {
    if (callback) {
      callback();
    }
  };
  
  window.addEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resultsVisibilityChanged', handleResultsVisibilityChanged);
  };
};