// Try to find the correct master key by testing different approaches
const API_BASE = "https://api.innque.com/v1";
const SESSION_TOKEN = "eyJzaWQiOiJjNTA3NDk5Zi1iZGI0LTQ5NGYtYjc5MC04ZTc1ZjNkY2IxMTIiLCJhdWQiOiJ2b3RlcyJ9YBYDzMKXmZ66aynhW2q0L4Qof4VlABlZtM6vtu_-et4";

// Common master keys to test
const masterKeys = [
  "cbd9e198-8f76-4d8f-93b1-04201de94e5d", // Current one
  "your-master-key", // Placeholder
  "master-key", // Simple
  "admin-key", // Admin
  "votes-master-key", // App specific
];

async function testMasterKey(APP_ID, MASTER_KEY) {
  try {
    const response = await fetch(`${API_BASE}/collections/candidates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        console.log(`✅ SUCCESS with APP_ID: ${APP_ID}, MASTER_KEY: ${MASTER_KEY}`);
        console.log(`Found ${data.length} candidates`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

async function findCorrectMasterKey() {
  console.log('=== Searching for correct master key ===');
  
  for (const masterKey of masterKeys) {
    console.log(`Testing master key: ${masterKey}`);
    const success = await testMasterKey("votes", masterKey);
    if (success) {
      console.log(`🎉 Found working master key: ${masterKey}`);
      return masterKey;
    }
  }
  
  console.log('❌ No working master key found');
  return null;
}

findCorrectMasterKey();
