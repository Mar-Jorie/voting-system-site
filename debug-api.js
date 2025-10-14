// Debug API connection issues
const API_BASE = "https://api.innque.com/v1";

// Test with different credentials
const credentials = [
  { APP_ID: "votes", MASTER_KEY: "Cbd9e198-8f76-4d8f-93b1-04201de94e5d" },
  { APP_ID: "your-application-id", MASTER_KEY: "Cbd9e198-8f76-4d8f-93b1-04201de94e5d" }
];

async function testWithCredentials(APP_ID, MASTER_KEY) {
  console.log(`\n=== Testing with APP_ID: ${APP_ID} ===`);
  
  try {
    const response = await fetch(`${API_BASE}/collections/candidates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Candidates found:', data.length);
    console.log('Data:', data);
    
    // Also test other collections
    const collections = ['votes', 'users', 'roles', 'faqs', 'voting_sessions'];
    
    for (const collection of collections) {
      try {
        const colResponse = await fetch(`${API_BASE}/collections/${collection}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Application-Id': APP_ID,
            'X-Master-Key': MASTER_KEY
          }
        });
        
        if (colResponse.ok) {
          const colData = await colResponse.json();
          console.log(`${collection}: ${colData.length} records`);
        } else {
          console.log(`${collection}: Error ${colResponse.status}`);
        }
      } catch (err) {
        console.log(`${collection}: Error - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

async function runTests() {
  for (const cred of credentials) {
    await testWithCredentials(cred.APP_ID, cred.MASTER_KEY);
  }
}

runTests();
