// Debug script to test candidates API
const API_BASE = 'https://api.innque.com/v1';
const APP_ID = 'votes';
const MASTER_KEY = 'cbd9e198-8f76-4d8f-93b1-04201de94e5d';

async function testCandidatesAPI() {
  console.log('Testing candidates API...');
  console.log('APP_ID:', APP_ID);
  console.log('MASTER_KEY:', MASTER_KEY.substring(0, 8) + '...');
  
  try {
    const response = await fetch(`${API_BASE}/objects/candidates`, {
      method: 'GET',
      headers: {
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success! Found', data.length, 'candidates');
      if (data.length > 0) {
        console.log('First candidate:', data[0]);
      }
    }
  } catch (error) {
    console.error('Network Error:', error.message);
  }
}

testCandidatesAPI();
