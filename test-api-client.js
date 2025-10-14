// Test the API client directly
import apiClient from './src/usecases/api.js';

async function testAPIClient() {
  try {
    console.log('Testing API client...');
    
    const candidates = await apiClient.findObjects('candidates', {});
    console.log('Candidates found:', candidates.length);
    console.log('First candidate:', candidates[0]);
    
  } catch (error) {
    console.error('API Client Error:', error);
  }
}

testAPIClient();
