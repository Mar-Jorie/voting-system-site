// Debug frontend role loading
const API_BASE = "https://api.innque.com/v1";
const APP_ID = "votes";
const MASTER_KEY = "cbd9e198-8f76-4d8f-93b1-04201de94e5d";

async function debugFrontendRoles() {
  try {
    console.log('=== Debugging Frontend Role Loading ===');
    
    // Simulate the exact same API calls that the frontend makes
    console.log('\n1. Loading users...');
    const usersResponse = await fetch(`${API_BASE}/collections/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (!usersResponse.ok) {
      console.error('Failed to fetch users:', usersResponse.status);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log(`Found ${usersData.length} users`);
    
    console.log('\n2. Loading roles...');
    const rolesResponse = await fetch(`${API_BASE}/collections/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Id': APP_ID,
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (!rolesResponse.ok) {
      console.error('Failed to fetch roles:', rolesResponse.status);
      return;
    }
    
    const rolesData = await rolesResponse.json();
    console.log(`Found ${rolesData.length} roles`);
    
    // Create a map of role IDs to role objects for quick lookup
    const rolesMap = {};
    rolesData.forEach(role => {
      rolesMap[role.id] = role;
      console.log(`  Role: ${role.name} (ID: ${role.id})`);
    });
    
    console.log('\n3. Merging role data...');
    // Merge role data into users (exact same logic as frontend)
    const usersWithRoles = usersData.map(user => {
      console.log(`\nProcessing user: ${user.email}`);
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
    
    console.log('\n4. Final result:');
    usersWithRoles.forEach((user, index) => {
      console.log(`  User ${index + 1}:`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Name: ${user.firstName} ${user.lastName}`);
      console.log(`    Status: ${user.status}`);
      console.log(`    Roles:`, user.roles);
      
      // Test the display functions
      const roleDisplay = getRoleDisplayName(user.roles);
      const roleColor = getRoleBadgeColor(user.roles);
      console.log(`    Display: "${roleDisplay}"`);
      console.log(`    Color: "${roleColor}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Copy the exact functions from the frontend
function getRoleDisplayName(role) {
  // Handle undefined or null roles
  if (!role) {
    return 'No Role';
  }
  
  // Handle Relation objects (array of role objects with id and name)
  if (Array.isArray(role) && role.length > 0) {
    return role[0].name || 'Unknown Role';
  }
  
  // Handle simple string role (fallback)
  if (typeof role === 'string') {
    return role;
  }
  
  return 'No Role';
}

function getRoleBadgeColor(role) {
  // Handle undefined or null roles
  if (!role) {
    return 'bg-gray-100 text-gray-800';
  }
  
  // Handle Relation objects (array of role objects with id and name)
  let roleName = '';
  if (Array.isArray(role) && role.length > 0) {
    roleName = role[0].name || '';
  } else if (typeof role === 'string') {
    roleName = role;
  }
  
  switch (roleName) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'moderator':
      return 'bg-blue-100 text-blue-800';
    case 'user':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

debugFrontendRoles();
