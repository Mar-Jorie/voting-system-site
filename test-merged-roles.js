// Test merged role data approach
const API_BASE = "https://api.innque.com/v1";
const APP_ID = "votes";
const MASTER_KEY = "cbd9e198-8f76-4d8f-93b1-04201de94e5d";

async function testMergedRoles() {
  try {
    console.log('=== Testing Merged Role Data ===');
    
    // Load users and roles separately
    const [usersResponse, rolesResponse] = await Promise.all([
      fetch(`${API_BASE}/collections/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Application-Id': APP_ID,
          'X-Master-Key': MASTER_KEY
        }
      }),
      fetch(`${API_BASE}/collections/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Application-Id': APP_ID,
          'X-Master-Key': MASTER_KEY
        }
      })
    ]);
    
    if (usersResponse.ok && rolesResponse.ok) {
      const usersData = await usersResponse.json();
      const rolesData = await rolesResponse.json();
      
      console.log(`Found ${usersData.length} users and ${rolesData.length} roles`);
      
      // Create a map of role IDs to role objects for quick lookup
      const rolesMap = {};
      rolesData.forEach(role => {
        rolesMap[role.id] = role;
        console.log(`Role: ${role.name} (ID: ${role.id})`);
      });
      
      // Merge role data into users
      const usersWithRoles = usersData.map(user => {
        if (user.roles && Array.isArray(user.roles)) {
          user.roles = user.roles.map(roleRef => ({
            ...roleRef,
            name: rolesMap[roleRef.id]?.name || 'Unknown Role',
            description: rolesMap[roleRef.id]?.description || '',
            permissions: rolesMap[roleRef.id]?.permissions || []
          }));
        }
        return user;
      });
      
      console.log('\nUsers with merged role data:');
      usersWithRoles.forEach((user, index) => {
        console.log(`  User ${index + 1}:`);
        console.log(`    Name: ${user.firstName} ${user.lastName}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Status: ${user.status}`);
        if (user.roles && user.roles.length > 0) {
          console.log(`    Roles:`, user.roles);
          console.log(`    Role Name: ${user.roles[0].name}`);
          console.log(`    Role Description: ${user.roles[0].description}`);
        } else {
          console.log(`    Roles: No roles assigned`);
        }
        console.log('');
      });
      
    } else {
      console.error('Failed to fetch data');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testMergedRoles();
