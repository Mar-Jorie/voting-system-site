// Test user role handling
const API_BASE = "https://api.innque.com/v1";
const APP_ID = "votes";
const MASTER_KEY = "cbd9e198-8f76-4d8f-93b1-04201de94e5d";

async function testUserRoles() {
  try {
    console.log('=== Testing User Role Handling ===');
    
    // Test 1: Fetch users with role data
    console.log('\n1. Fetching users with role data...');
    const usersResponse = await fetch(`${API_BASE}/collections/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`  User ${index + 1}:`);
        console.log(`    Name: ${user.firstName} ${user.lastName}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Status: ${user.status}`);
        console.log(`    Roles:`, user.roles);
        if (user.roles && user.roles.length > 0) {
          console.log(`    Role Name: ${user.roles[0].name || 'Unknown'}`);
        }
        console.log('');
      });
    } else {
      console.error('Failed to fetch users:', usersResponse.status);
    }
    
    // Test 2: Fetch roles
    console.log('\n2. Fetching roles...');
    const rolesResponse = await fetch(`${API_BASE}/collections/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (rolesResponse.ok) {
      const roles = await rolesResponse.json();
      console.log(`Found ${roles.length} roles:`);
      roles.forEach((role, index) => {
        console.log(`  Role ${index + 1}:`);
        console.log(`    ID: ${role.id}`);
        console.log(`    Name: ${role.name}`);
        console.log(`    Description: ${role.description}`);
        console.log(`    Permissions: ${role.permissions?.join(', ')}`);
        console.log('');
      });
    } else {
      console.error('Failed to fetch roles:', rolesResponse.status);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testUserRoles();
