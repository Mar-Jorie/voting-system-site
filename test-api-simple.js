// Simple API test without Vite environment variables
const API_BASE = "https://api.innque.com/v1";
const APP_ID = "votes";
const MASTER_KEY = "cbd9e198-8f76-4d8f-93b1-04201de94e5d";

async function testAPI() {
  try {
    console.log('Testing API connection...');
    console.log('API Base:', API_BASE);
    console.log('App ID:', APP_ID);
    console.log('Master Key:', MASTER_KEY.substring(0, 8) + '...');
    
    const response = await fetch(`${API_BASE}/collections/users?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Connection: SUCCESS');
      console.log('Users found:', data ? data.length : 0);
      
      if (data && data.length > 0) {
        console.log('Sample user data:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('No users found in database');
      }
    } else {
      console.log('❌ API Connection: FAILED');
      console.log('Status:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ API Connection: FAILED');
    console.log('Error:', error.message);
  }
}

testAPI();
