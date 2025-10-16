// Vote Control Utility
// Manages voting status (active/stopped) and automatic stop scheduling

export const VOTE_STATUS = {
  ACTIVE: 'active',
  STOPPED: 'stopped'
};

export const RESULTS_VISIBILITY = {
  HIDDEN: 'hidden',
  PUBLIC: 'public'
};

export const VOTE_CONTROL_STORAGE_KEY = 'voteControl';

// Get current vote control settings
export const getVoteControl = () => {
  try {
    const stored = localStorage.getItem(VOTE_CONTROL_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        status: data.status || VOTE_STATUS.ACTIVE,
        autoStopDate: data.autoStopDate ? new Date(data.autoStopDate) : null,
        stoppedAt: data.stoppedAt ? new Date(data.stoppedAt) : null,
        stoppedBy: data.stoppedBy || null,
        reason: data.reason || null
      };
    }
  } catch (error) {
    // Error reading vote control - handled silently
  }
  
  return {
    status: VOTE_STATUS.ACTIVE,
    autoStopDate: null,
    stoppedAt: null,
    stoppedBy: null,
    reason: null
  };
};

// Set vote control settings
export const setVoteControl = (settings) => {
  try {
    localStorage.setItem(VOTE_CONTROL_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    // Error saving vote control - handled silently
    return false;
  }
};

// Check if voting is currently active
export const isVotingActive = () => {
  const control = getVoteControl();
  
  // If manually stopped, voting is not active
  if (control.status === VOTE_STATUS.STOPPED) {
    return false;
  }
  
  // Check if auto-stop date has passed
  if (control.autoStopDate && new Date() >= control.autoStopDate) {
    // Auto-stop voting
    setVoteControl({
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

// Manually stop voting
export const stopVoting = (stoppedBy = 'admin', reason = 'Manually stopped by administrator', clearAutoStop = false) => {
  const control = getVoteControl();
  return setVoteControl({
    ...control,
    status: VOTE_STATUS.STOPPED,
    stoppedAt: new Date(),
    stoppedBy,
    reason,
    autoStopDate: clearAutoStop ? null : control.autoStopDate
  });
};

// Start voting (resume)
export const startVoting = () => {
  const control = getVoteControl();
  return setVoteControl({
    ...control,
    status: VOTE_STATUS.ACTIVE,
    stoppedAt: null,
    stoppedBy: null,
    reason: null
  });
};

// Set automatic stop date
export const setAutoStopDate = (date) => {
  const control = getVoteControl();
  return setVoteControl({
    ...control,
    autoStopDate: date
  });
};

// Get voting status info for display
export const getVotingStatusInfo = () => {
  const control = getVoteControl();
  const isActive = isVotingActive();
  
  return {
    isActive,
    status: control.status,
    autoStopDate: control.autoStopDate,
    stoppedAt: control.stoppedAt,
    stoppedBy: control.stoppedBy,
    reason: control.reason,
    timeUntilStop: control.autoStopDate ? Math.max(0, control.autoStopDate.getTime() - new Date().getTime()) : null
  };
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

// Results Visibility Functions
export const getResultsVisibility = () => {
  try {
    const stored = localStorage.getItem('resultsVisibility');
    return stored || RESULTS_VISIBILITY.HIDDEN;
  } catch (error) {
    // Error getting results visibility - handled silently
    return RESULTS_VISIBILITY.HIDDEN;
  }
};

export const setResultsVisibility = (visibility) => {
  try {
    localStorage.setItem('resultsVisibility', visibility);
    window.dispatchEvent(new Event('resultsVisibilityChanged'));
    return true;
  } catch (error) {
    // Error setting results visibility - handled silently
    return false;
  }
};

export const isResultsPublic = () => {
  return getResultsVisibility() === RESULTS_VISIBILITY.PUBLIC;
};

export const hideResults = () => {
  return setResultsVisibility(RESULTS_VISIBILITY.HIDDEN);
};

export const showResults = () => {
  return setResultsVisibility(RESULTS_VISIBILITY.PUBLIC);
};
