// Role-based access control utilities

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin'
};

export const hasPermission = (userRole, requiredPermission) => {
  if (!userRole) return false;
  
  const rolePermissions = {
    [ROLES.ADMIN]: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.ADMIN],
    [ROLES.USER]: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    [ROLES.VIEWER]: [PERMISSIONS.READ]
  };
  
  return rolePermissions[userRole]?.includes(requiredPermission) || false;
};

export const canRead = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.READ);
};

export const canWrite = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.WRITE);
};

export const canDelete = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.DELETE);
};

export const isAdmin = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.ADMIN);
};

export const getUserRole = (user) => {
  if (!user) return null;
  return user.role?.name || user.role || null;
};

export const checkAccess = (user, requiredPermission) => {
  const userRole = getUserRole(user);
  return hasPermission(userRole, requiredPermission);
};
