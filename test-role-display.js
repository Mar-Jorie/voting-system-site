// Test role display functions
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

// Test cases
console.log('=== Testing Role Display Functions ===');

// Test 1: Undefined role
console.log('\n1. Undefined role:');
console.log(`  Display: "${getRoleDisplayName(undefined)}"`);
console.log(`  Color: "${getRoleBadgeColor(undefined)}"`);

// Test 2: Null role
console.log('\n2. Null role:');
console.log(`  Display: "${getRoleDisplayName(null)}"`);
console.log(`  Color: "${getRoleBadgeColor(null)}"`);

// Test 3: Empty array
console.log('\n3. Empty array:');
console.log(`  Display: "${getRoleDisplayName([])}"`);
console.log(`  Color: "${getRoleBadgeColor([])}"`);

// Test 4: Role with name
console.log('\n4. Role with name:');
const roleWithName = [{ id: '123', name: 'admin' }];
console.log(`  Display: "${getRoleDisplayName(roleWithName)}"`);
console.log(`  Color: "${getRoleBadgeColor(roleWithName)}"`);

// Test 5: Role without name
console.log('\n5. Role without name:');
const roleWithoutName = [{ id: '123' }];
console.log(`  Display: "${getRoleDisplayName(roleWithoutName)}"`);
console.log(`  Color: "${getRoleBadgeColor(roleWithoutName)}"`);

// Test 6: String role
console.log('\n6. String role:');
console.log(`  Display: "${getRoleDisplayName('user')}"`);
console.log(`  Color: "${getRoleBadgeColor('user')}"`);

console.log('\n=== Test Complete ===');
