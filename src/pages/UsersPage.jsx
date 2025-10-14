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
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    role: ''
  });
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Hooks
  const { user: currentUser } = useApp();

  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' }
  ];

  // Status options - Only active and inactive
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
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
    if (!user) return 'Unknown User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User';
  };

  const getUserInitials = (user) => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials || 'U';
  };

  // Selection management
  const handleSelectionChange = (newSelectedRows) => {
    setSelectedRows(newSelectedRows);
  };

  // Bulk actions
  const handleBulkExport = () => {
    const selectedUsers = filteredUsers.filter((_, index) => selectedRows.has(index));
    if (selectedUsers.length === 0) {
      toast.error('No users selected for export');
      return;
    }
    
    try {
      // Create CSV content
      const headers = ['Name', 'Username', 'Email', 'Role', 'Status', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...selectedUsers.map(user => [
          `"${getUserDisplayName(user)}"`,
          `"${user.username}"`,
          `"${user.email}"`,
          `"${getRoleDisplayName(user.role)}"`,
          `"${getStatusDisplayName(user.status)}"`,
          `"${new Date(user.createdAt).toLocaleDateString()}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${selectedUsers.length} users successfully`);
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const handleBulkDelete = () => {
    const selectedUsers = filteredUsers.filter((_, index) => selectedRows.has(index));
    if (selectedUsers.length === 0) {
      toast.error('No users selected for deletion');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const selectedUsers = filteredUsers.filter((_, index) => selectedRows.has(index));
    if (selectedUsers.length === 0) return;

    try {
      // Delete selected users from localStorage
      const updatedUsers = users.filter(user => 
        !selectedUsers.some(selected => selected.id === user.id)
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      setSelectedRows(new Set());
      setShowBulkDeleteModal(false);
      toast.success(`Deleted ${selectedUsers.length} users successfully`);
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete users');
    }
  };

  const handleBulkStatusToggle = () => {
    const selectedUsers = filteredUsers.filter((_, index) => selectedRows.has(index));
    if (selectedUsers.length === 0) {
      toast.error('No users selected for status change');
      return;
    }
    
    // Determine new status based on first selected user
    const firstUser = selectedUsers[0];
    const newStatus = firstUser.status === 'active' ? 'inactive' : 'active';
    
    // Update all selected users
    const updatedUsers = users.map(user => {
      if (selectedUsers.some(selected => selected.id === user.id)) {
        return { ...user, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return user;
    });
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setSelectedRows(new Set());
    toast.success(`Updated ${selectedUsers.length} users to ${newStatus}`);
  };

  // Individual user status toggle
  const handleUserStatusToggle = (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const updatedUsers = users.map(u => 
      u.id === user.id 
        ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
        : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    toast.success(`User status updated to ${newStatus}`);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'firstName',
      label: 'User',
      render: (value, user) => (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {getUserDisplayName(user)}
          </div>
          <div className="text-sm text-gray-500">
            {user.email}
          </div>
        </div>
      )
    },
    {
      key: 'username',
      label: 'Username',
      render: (value, user) => (
        <span className="text-sm text-gray-900">{user.username}</span>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (value, user) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
          {getRoleDisplayName(user.role)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, user) => (
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
          loading={loading}
          sortable={true}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
          enableSelection={true}
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
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
          additionalActions={(user) => [
            { 
              label: user.status === 'active' ? 'Set Inactive' : 'Set Active', 
              icon: user.status === 'active' ? 'CheckCircleIcon' : 'CheckCircleIcon', 
              variant: user.status === 'active' ? 'warning' : 'success',
              action: handleUserStatusToggle
            }
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

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Users"
        message={`Are you sure you want to delete ${selectedRows.size} selected users? This action cannot be undone.`}
        confirmLabel="Delete All"
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
        selectedCount={selectedRows.size}
        bulkActions={[
          { name: 'Export Selected', icon: 'ArrowDownTrayIcon', action: handleBulkExport, color: 'bg-blue-600' },
          { name: 'Delete Selected', icon: 'TrashIcon', action: handleBulkDelete, color: 'bg-red-600' },
          { name: 'Toggle Status', icon: 'CheckCircleIcon', action: handleBulkStatusToggle, color: 'bg-orange-600' }
        ]}
        quickActions={[
          { name: 'Add User', icon: 'PlusIcon', action: handleAddUser, color: 'bg-primary-600' },
          { name: 'Import Users', icon: 'ArrowUpTrayIcon', action: () => toast.info('Import feature coming soon'), color: 'bg-green-600' },
          { name: 'Export All Users', icon: 'ArrowDownTrayIcon', action: () => {
            if (filteredUsers.length === 0) {
              toast.error('No users to export');
              return;
            }
            // Export all filtered users
            const headers = ['Name', 'Username', 'Email', 'Role', 'Status', 'Created At'];
            const csvContent = [
              headers.join(','),
              ...filteredUsers.map(user => [
                `"${getUserDisplayName(user)}"`,
                `"${user.username}"`,
                `"${user.email}"`,
                `"${getRoleDisplayName(user.role)}"`,
                `"${getStatusDisplayName(user.status)}"`,
                `"${new Date(user.createdAt).toLocaleDateString()}"`
              ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `all-users-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Exported ${filteredUsers.length} users successfully`);
          }, color: 'bg-blue-600' }
        ]}
      />
    </div>
  );
};

export default UsersPage;
