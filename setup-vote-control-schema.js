// Setup script for vote_control database schema
// This script creates the vote_control collection in the database

import apiClient from './src/usecases/api.js';

const VOTE_STATUS = {
  ACTIVE: 'active',
  STOPPED: 'stopped'
};

const RESULTS_VISIBILITY = {
  HIDDEN: 'hidden',
  PUBLIC: 'public'
};

async function setupVoteControlSchema() {
  try {
    console.log('Setting up vote_control schema...');
    
    // Check if vote_control collection already exists
    const existingControls = await apiClient.findObjects('vote_control', {});
    
    if (existingControls && existingControls.length > 0) {
      console.log('Vote control collection already exists with', existingControls.length, 'records');
      return existingControls[0];
    }
    
    // Create initial vote control record
    const initialControl = {
      status: VOTE_STATUS.ACTIVE,
      auto_stop_date: null,
      stopped_at: null,
      stopped_by: null,
      reason: null,
      results_visibility: RESULTS_VISIBILITY.HIDDEN,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const createdControl = await apiClient.createObject('vote_control', initialControl);
    console.log('Created initial vote control record:', createdControl);
    
    return createdControl;
    
  } catch (error) {
    console.error('Error setting up vote control schema:', error);
    throw error;
  }
}

// Run the setup
setupVoteControlSchema()
  .then((result) => {
    console.log('Vote control schema setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Vote control schema setup failed:', error);
    process.exit(1);
  });
