// Debug role merging issue
const API_BASE = "https://api.innque.com/v1";
const APP_ID = "votes";
const MASTER_KEY = "cbd9e198-8f76-4d8f-93b1-04201de94e5d";

async function debugRoles() {
  try {
    console.log('=== Debugging Role Merging ===');
    
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
      
      console.log('Raw users data:');
      usersData.forEach((user, index) => {
        console.log(`  User ${index + 1}:`, {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          roles: user.roles
        });
      });
      
      console.log('\nRaw roles data:');
      rolesData.forEach((role, index) => {
        console.log(`  Role ${index + 1}:`, {
          id: role.id,
          name: role.name,
          description: role.description
        });
      });
      
      // Create a map of role IDs to role objects for quick lookup
      const rolesMap = {};
      rolesData.forEach(role => {
        rolesMap[role.id] = role;
      });
      
      console.log('\nRoles map:', rolesMap);
      
      // Merge role data into users
      const usersWithRoles = usersData.map(user => {
        console.log(`\nProcessing user ${user.email}:`);
        console.log(`  Original roles:`, user.roles);
        
        if (user.roles && Array.isArray(user.roles)) {
          user.roles = user.roles.map(roleRef => {
            console.log(`    Processing role ref:`, roleRef);
            const fullRole = rolesMap[roleRef.id];
            console.log(`    Found full role:`, fullRole);
            
            return {
              ...roleRef,
              name: fullRole?.name || 'Unknown Role',
              description: fullRole?.description || '',
              permissions: fullRole?.permissions || []
            };
          });
        }
        
        console.log(`  Final roles:`, user.roles);
        return user;
      });
      
      console.log('\nFinal users with merged roles:');
      usersWithRoles.forEach((user, index) => {
        console.log(`  User ${index + 1}:`, {
          email: user.email,
          roles: user.roles
        });
      });
      
    } else {
      console.error('Failed to fetch data');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugRoles();
