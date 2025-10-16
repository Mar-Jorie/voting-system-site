// Test script to debug vote control API issues
import apiClient from './src/usecases/api.js';

async function testVoteControl() {
  try {
    console.log('Testing vote control API...');
    
    // Test 1: Get current voting sessions
    console.log('\n1. Getting current voting sessions...');
    const sessions = await apiClient.findObjects('voting_sessions', {});
    console.log('Sessions:', sessions);
    
    if (sessions && sessions.length > 0) {
      const session = sessions[0];
      console.log('\n2. Current session:', session);
      
      // Test 2: Update the session
      console.log('\n3. Updating session to active...');
      const updateData = {
        is_active: true,
        results_visibility: 'hidden'
      };
      
      console.log('Update data:', updateData);
      const result = await apiClient.updateObject('voting_sessions', session.id, updateData);
      console.log('Update result:', result);
      
      // Test 3: Verify the update
      console.log('\n4. Verifying update...');
      const updatedSessions = await apiClient.findObjects('voting_sessions', {});
      console.log('Updated sessions:', updatedSessions);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

testVoteControl();
