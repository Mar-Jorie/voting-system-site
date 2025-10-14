// Cleanup utility for invalid vote data
export const cleanupInvalidVotes = () => {
  try {
    const storedVotes = JSON.parse(localStorage.getItem('votes') || '[]');
    
    // Filter out votes with invalid timestamps or missing required fields
    const validVotes = storedVotes.filter(vote => {
      // Check if vote has required fields
      if (!vote.id || !vote.voterName || !vote.voterEmail) {
        return false;
      }
      
      // Check if timestamp is valid
      if (vote.timestamp) {
        const date = new Date(vote.timestamp);
        if (isNaN(date.getTime())) {
          return false;
        }
      }
      
      // Check if id is valid (should be a timestamp string)
      if (vote.id && !isNaN(Number(vote.id))) {
        const date = new Date(Number(vote.id));
        if (isNaN(date.getTime())) {
          return false;
        }
      }
      
      return true;
    });
    
    // Update localStorage with cleaned votes
    localStorage.setItem('votes', JSON.stringify(validVotes));
    
    
    return validVotes;
  } catch (error) {
    return [];
  }
};

// Auto-cleanup on import
cleanupInvalidVotes();
