// Users Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, PlusIcon, UserIcon, EllipsisVerticalIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InputFactory from '../components/InputFactory';
import SelectInput from '../components/SelectInput';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import SearchFilter from '../components/SearchFilter';
import CollapsibleTable from '../components/CollapsibleTable';
import { toast } from 'react-hot-toast';
import useApp from '../hooks/useApp';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    role: ''
  });

  // Hooks
  const { user: currentUser } = useApp();

  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' }
  ];

  // Status options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ];

  // Form fields configuration
  const fields = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'String',
      required: true,
      placeholder: 'Enter first name'
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'String',
      required: true,
      placeholder: 'Enter last name'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'String',
      required: true,
      format: 'email',
      placeholder: 'Enter email address'
    },
    {
      name: 'username',
      label: 'Username',
      type: 'String',
      required: true,
      placeholder: 'Enter username'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'String',
      required: true,
      format: 'password',
      showPasswordToggle: true,
      placeholder: 'Enter password'
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: roleOptions,
      placeholder: 'Select role'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: statusOptions,
      placeholder: 'Select status'
    }
  ];

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search or filters change
  useEffect(() => {
    filterUsers();
  }, [users, searchValue, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // For now, load from localStorage since we're using mock data
      // In production, this would use the API
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // If no users in localStorage, create a default admin user
      if (storedUsers.length === 0) {
        const defaultUser = {
          id: 'user-1',
          email: 'admin@example.com',
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify([defaultUser]));
        setUsers([defaultUser]);
      } else {
        setUsers(storedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchValue) {
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    setFilteredUsers(filtered);
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({});
    setErrors({});
    setShowFormModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status
    });
    setErrors({});
    setShowFormModal(true);
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (formData) => {
    setErrors({});

    try {
      if (editingUser) {
        // Update existing user
        const updatedUsers = users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...formData, updatedAt: new Date().toISOString() }
            : user
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        toast.success('User updated successfully');
      } else {
        // Create new user
        const newUser = {
          id: `user-${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedUsers = [...users, newUser];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        toast.success('User created successfully');
      }
      
      setShowFormModal(false);
      setFormData({});
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Failed to save user');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    try {
      // Delete user from localStorage
      const updatedUsers = users.filter(user => user.id !== deletingUser.id);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const getRoleDisplayName = (role) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption ? roleOption.label : role;
  };

  const getStatusDisplayName = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserDisplayName = (user) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User';
  };

  const getUserInitials = (user) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  // Table columns configuration
  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {getUserInitials(user)}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {getUserDisplayName(user)}
            </div>
            <div className="text-sm text-gray-500">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'username',
      label: 'Username',
      render: (user) => (
        <span className="text-sm text-gray-900">{user.username}</span>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
          {getRoleDisplayName(user.role)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
          {getStatusDisplayName(user.status)}
        </span>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage system users and their permissions.
        </p>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <SearchFilter
          placeholder="Search users..."
          value={searchValue}
          onChange={handleSearchChange}
          onSearch={handleSearchChange}
          onFilterChange={handleFilterChange}
          filters={filters}
          useSelectForSearch={false}
          statusOptions={statusOptions}
          getUniqueCompanies={() => []}
          additionalFilters={[
            {
              key: 'role',
              label: 'Role',
              options: roleOptions
            }
          ]}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <CollapsibleTable
          data={filteredUsers}
          columns={columns}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          loading={loading || findLoading}
          sortable={true}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
          expandableContent={(user) => (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Username:</span>
                  <p className="text-sm text-gray-900">{user.username}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Role:</span>
                  <p className="text-sm text-gray-900">{getRoleDisplayName(user.role)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <p className="text-sm text-gray-900">{getStatusDisplayName(user.status)}</p>
                </div>
              </div>
            </div>
          )}
          additionalActions={[
            { label: 'View Details', icon: 'EyeIcon', variant: 'secondaryOutline' }
          ]}
          searchPlaceholder="Search users..."
          emptyMessage="No users found"
        />
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        title={editingUser ? 'Edit User' : 'Create New User'}
        fields={fields}
        initialData={formData}
        loading={false}
        isUpdate={!!editingUser}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser ? getUserDisplayName(deletingUser) : 'this user'}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="danger"
      />

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant="single"
        icon="PlusIcon"
        label="Add new user"
        action={handleAddUser}
        quickActions={[
          { name: 'Add User', icon: 'PlusIcon', action: handleAddUser, color: 'bg-primary-600' },
          { name: 'Import Users', icon: 'ArrowUpTrayIcon', action: () => toast.info('Import feature coming soon'), color: 'bg-green-600' },
          { name: 'Export Users', icon: 'ArrowDownTrayIcon', action: () => toast.info('Export feature coming soon'), color: 'bg-blue-600' }
        ]}
      />
    </div>
  );
};

export default UsersPage;
