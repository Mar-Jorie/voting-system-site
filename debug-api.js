// Debug API authentication issue
console.log('Testing API authentication...');

// Test the API call directly
async function testAPI() {
  const API_BASE = "https://api.innque.com/v1";
  const APP_ID = "votes";
  const MASTER_KEY = "cbd9e198-8f76-4d8f-93b1-04201de94e5d";
  
  const url = `${API_BASE}/collections/voting_sessions/c2e86551-902a-4f05-a879-78b6d2c08252`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Application-Id': APP_ID,
    'X-Master-Key': MASTER_KEY
  };
  
  const body = {
    is_active: true,
    results_visibility: 'hidden'
  };
  
  console.log('Making API call...');
  console.log('URL:', url);
  console.log('Headers:', headers);
  console.log('Body:', body);
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    } else {
      const result = await response.json();
      console.log('Success response:', result);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testAPI();
