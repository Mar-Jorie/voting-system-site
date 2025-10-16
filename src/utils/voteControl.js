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
    console.log('🔄 getVoteControl: Fetching voting sessions from database...');
    const sessions = await apiClient.findObjects('voting_sessions', {});
    console.log('🔄 getVoteControl: Raw sessions data:', sessions);
    
    if (sessions && sessions.length > 0) {
      const session = sessions[0]; // Get the first (and should be only) session
      console.log('🔄 getVoteControl: Processing session:', session);
      console.log('🔄 getVoteControl: session.is_active =', session.is_active);
      
      // Handle end_date properly - only set autoStopDate if it's a valid future date
      let autoStopDate = null;
      if (session.end_date && session.end_date !== null && session.end_date !== '') {
        const endDate = new Date(session.end_date);
        // Only set autoStopDate if it's a valid date, not the Unix epoch (1970-01-01), and not a far future date (2099+)
        if (!isNaN(endDate.getTime()) && 
            endDate.getTime() > 0 && 
            endDate.getTime() > new Date('1970-01-02').getTime() &&
            endDate.getTime() < new Date('2099-01-01').getTime()) {
          autoStopDate = endDate;
        }
      }
      
      const result = {
        id: session.id,
        status: session.is_active ? VOTE_STATUS.ACTIVE : VOTE_STATUS.STOPPED,
        autoStopDate: autoStopDate,
        stoppedAt: session.is_active ? null : new Date(session.updated),
        stoppedBy: session.is_active ? null : 'admin',
        reason: session.is_active ? null : 'Voting session deactivated',
        resultsVisibility: session.results_visibility || RESULTS_VISIBILITY.HIDDEN,
        updatedAt: new Date(session.updated)
      };
      
      console.log('🔄 getVoteControl: Returning processed result:', result);
      return result;
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
    
    // Validate control object
    if (!control) {
      throw new Error('Control object is null or undefined');
    }
    
    if (!control.id) {
      throw new Error('Control object missing required id field');
    }
    
    if (control.status === undefined || control.status === null) {
      throw new Error('Control object missing required status field');
    }
    
    if (control.id) {
      // Update existing voting session
      const updateData = {
        is_active: control.status === VOTE_STATUS.ACTIVE,
        end_date: (control.autoStopDate && control.autoStopDate !== null) ? control.autoStopDate.toISOString() : '2099-12-31T23:59:59.000Z',
        results_visibility: control.resultsVisibility || RESULTS_VISIBILITY.HIDDEN
      };
      
      console.log('🔄 setVoteControl: Control ID:', control.id);
      console.log('🔄 setVoteControl: Updating with data:', updateData);
      console.log('🔄 setVoteControl: API call: updateObject("voting_sessions", "' + control.id + '", updateData)');
      
      // Validate updateData before sending to API
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Invalid updateData object');
      }
      
      try {
        const result = await apiClient.updateObject('voting_sessions', control.id, updateData);
        console.log('🔄 setVoteControl: Update result:', result);
        
        if (!result) {
          throw new Error('Failed to update voting session - API returned null/undefined');
        }
        
        // Verify the update was successful by checking the returned data
        if (result.is_active !== updateData.is_active) {
          console.error('❌ setVoteControl: Update verification failed - is_active mismatch');
          console.error('❌ Expected:', updateData.is_active, 'Got:', result.is_active);
          throw new Error('Database update verification failed');
        }
        
        console.log('✅ setVoteControl: Update verified successfully');
      } catch (apiError) {
        console.error('❌ setVoteControl: API call failed:', apiError);
        throw new Error(`API call failed: ${apiError.message}`);
      }
      
      // Verify the update by reading back the data
      const verifyResult = await apiClient.findObjects('voting_sessions', {});
      console.log('🔄 setVoteControl: Verification - current sessions:', verifyResult);
    } else {
      // Create new voting session
      const createData = {
        title: 'Corporate Party 2025 - Star of the Night Awards',
        description: 'Voting for outstanding guests at Corporate Party 2025',
        start_date: new Date().toISOString(),
        end_date: (control.autoStopDate && control.autoStopDate !== null) ? control.autoStopDate.toISOString() : '2099-12-31T23:59:59.000Z',
        is_active: control.status === VOTE_STATUS.ACTIVE,
        results_visibility: control.resultsVisibility || RESULTS_VISIBILITY.HIDDEN
      };
      
      console.log('🔄 setVoteControl: Creating with data:', createData);
      
      // Validate createData before sending to API
      if (!createData || typeof createData !== 'object') {
        throw new Error('Invalid createData object');
      }
      
      const result = await apiClient.createObject('voting_sessions', createData);
      console.log('🔄 setVoteControl: Create result:', result);
      
      if (!result) {
        throw new Error('Failed to create voting session');
      }
    }
    
    // Dispatch event to notify all devices of the change
    console.log('🔄 setVoteControl: Dispatching votingStatusChanged event');
    window.dispatchEvent(new CustomEvent('votingStatusChanged'));
    
    // Also dispatch a custom event with the new status for debugging
    const newControl = await getVoteControl();
    console.log('🔄 setVoteControl: Final control after update:', newControl);
    window.dispatchEvent(new CustomEvent('votingStatusUpdated', { detail: newControl }));
    
    return true;
  } catch (error) {
    console.error('❌ setVoteControl: Error setting vote control in database:', error);
    console.error('❌ setVoteControl: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
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

// Check if voting should be active without side effects (for display purposes)
export const isVotingActiveReadOnly = async () => {
  console.log('🔄 isVotingActiveReadOnly: Getting control...');
  const control = await getVoteControl();
  console.log('🔄 isVotingActiveReadOnly: Control received:', control);
  
  // If manually stopped, voting is not active
  if (control.status === VOTE_STATUS.STOPPED) {
    console.log('🔄 isVotingActiveReadOnly: Status is STOPPED, returning false');
    return false;
  }
  
  // Check if auto-stop date has passed (without modifying database)
  if (control.autoStopDate && new Date() >= control.autoStopDate) {
    console.log('🔄 isVotingActiveReadOnly: Auto-stop date has passed, returning false');
    return false;
  }
  
  console.log('🔄 isVotingActiveReadOnly: Voting should be active, returning true');
  return true;
};

// Manually stop voting (async version)
export const stopVoting = async (stoppedBy = 'admin', reason = 'Manually stopped by administrator', clearAutoStop = false) => {
  console.log('🔄 stopVoting: Starting with params:', { stoppedBy, reason, clearAutoStop });
  
  const control = await getVoteControl();
  console.log('🔄 stopVoting: Retrieved control:', control);
  
  if (!control) {
    throw new Error('Failed to retrieve current voting control settings');
  }
  
  const newControl = {
    ...control,
    status: VOTE_STATUS.STOPPED,
    stoppedAt: new Date(),
    stoppedBy,
    reason,
    autoStopDate: clearAutoStop ? null : control.autoStopDate
  };
  
  console.log('🔄 stopVoting: New control object:', newControl);
  
  return await setVoteControl(newControl);
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
    reason: null,
    autoStopDate: null  // Clear auto-stop date when starting voting
  };
  console.log('🔄 startVoting: Setting new control:', newControl);
  
  const result = await setVoteControl(newControl);
  console.log('🔄 startVoting: setVoteControl result:', result);
  
  // Wait a moment for the database update to propagate
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Verify the update was successful
  const verifyControl = await getVoteControl();
  console.log('🔄 startVoting: Verification - new control:', verifyControl);
  
  if (verifyControl.status !== VOTE_STATUS.ACTIVE) {
    console.error('❌ startVoting: Verification failed - status is still not ACTIVE');
    throw new Error('Failed to start voting - status verification failed');
  }
  
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
  
  // Calculate isActive directly from the control data to avoid race conditions
  let isActive = control.status === VOTE_STATUS.ACTIVE;
  
  // Check if auto-stop date has passed (without modifying database)
  if (isActive && control.autoStopDate && new Date() >= control.autoStopDate) {
    console.log('🔄 getVotingStatusInfo: Auto-stop date has passed, setting isActive to false');
    isActive = false;
  }
  
  console.log('🔄 getVotingStatusInfo: Calculated isActive:', isActive);
  
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