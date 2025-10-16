// Test API connection
import { findObjects } from './src/usecases/api.js';

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test finding users
    const users = await findObjects('users', {}, { limit: 5 });
    console.log('✅ API Connection: SUCCESS');
    console.log('Users found:', users ? users.length : 0);
    
    if (users && users.length > 0) {
      console.log('Sample user data:');
      console.log(JSON.stringify(users[0], null, 2));
    } else {
      console.log('No users found in database');
    }
    
    // Test finding other collections
    try {
      const candidates = await findObjects('candidates', {}, { limit: 3 });
      console.log('Candidates found:', candidates ? candidates.length : 0);
    } catch (err) {
      console.log('Candidates collection:', err.message);
    }
    
    try {
      const votes = await findObjects('votes', {}, { limit: 3 });
      console.log('Votes found:', votes ? votes.length : 0);
    } catch (err) {
      console.log('Votes collection:', err.message);
    }
    
  } catch (error) {
    console.log('❌ API Connection: FAILED');
    console.log('Error:', error.message);
  }
}

testAPI();
