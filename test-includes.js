// Test includes parameter for relations
const API_BASE = "https://api.innque.com/v1";
const APP_ID = "votes";
const MASTER_KEY = "cbd9e198-8f76-4d8f-93b1-04201de94e5d";

async function testIncludes() {
  try {
    console.log('=== Testing Includes Parameter ===');
    
    // Test 1: Fetch users without includes
    console.log('\n1. Fetching users without includes...');
    const usersResponse1 = await fetch(`${API_BASE}/collections/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (usersResponse1.ok) {
      const users = await usersResponse1.json();
      console.log('Users without includes:');
      users.forEach((user, index) => {
        console.log(`  User ${index + 1} roles:`, user.roles);
      });
    }
    
    // Test 2: Fetch users with includes parameter
    console.log('\n2. Fetching users with includes=roles...');
    const usersResponse2 = await fetch(`${API_BASE}/collections/users?includes=roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (usersResponse2.ok) {
      const users = await usersResponse2.json();
      console.log('Users with includes=roles:');
      users.forEach((user, index) => {
        console.log(`  User ${index + 1} roles:`, user.roles);
        if (user.roles && user.roles.length > 0) {
          console.log(`    Role name: ${user.roles[0].name || 'No name'}`);
        }
      });
    } else {
      console.error('Failed to fetch users with includes:', usersResponse2.status);
    }
    
    // Test 3: Try different includes format
    console.log('\n3. Fetching users with includes=roles.name...');
    const usersResponse3 = await fetch(`${API_BASE}/collections/users?includes=roles.name`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (usersResponse3.ok) {
      const users = await usersResponse3.json();
      console.log('Users with includes=roles.name:');
      users.forEach((user, index) => {
        console.log(`  User ${index + 1} roles:`, user.roles);
        if (user.roles && user.roles.length > 0) {
          console.log(`    Role name: ${user.roles[0].name || 'No name'}`);
        }
      });
    } else {
      console.error('Failed to fetch users with includes=roles.name:', usersResponse3.status);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testIncludes();
