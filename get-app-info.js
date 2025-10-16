// Get app information using session token
const API_BASE = "https://api.innque.com/v1";
const SESSION_TOKEN = "eyJzaWQiOiJjNTA3NDk5Zi1iZGI0LTQ5NGYtYjc5MC04ZTc1ZjNkY2IxMTIiLCJhdWQiOiJ2b3RlcyJ9YBYDzMKXmZ66aynhW2q0L4Qof4VlABlZtM6vtu_-et4";

async function getAppInfo() {
  try {
    // Try to get app information
    const response = await fetch(`${API_BASE}/apps/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SESSION_TOKEN}`
      }
    });
    
    console.log('App info response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('App info:', data);
    } else {
      const errorText = await response.text();
      console.log('App info error:', errorText);
    }
    
    // Try to get user info
    const userResponse = await fetch(`${API_BASE}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SESSION_TOKEN}`
      }
    });
    
    console.log('User info response status:', userResponse.status);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('User info:', userData);
    } else {
      const errorText = await userResponse.text();
      console.log('User info error:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getAppInfo();
