// Users Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, PlusIcon, UserIcon, EllipsisVerticalIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InputFactory from '../components/InputFactory';
import SelectInput from '../components/SelectInput';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import SearchFilter from '../components/SearchFilter';
import CollapsibleTable from '../components/CollapsibleTable';
import { ProgressiveLoader, TableSkeleton } from '../components/SkeletonLoader';
import { useOptimizedData } from '../hooks/useOptimizedData';
import { toast } from 'react-hot-toast';
import useApp from '../hooks/useApp';
import apiClient from '../usecases/api';
import auditLogger from '../utils/auditLogger.js';

const UsersPage = () => {
  // Use optimized data loading
  const {
    data: users,
    loading,
    error,
    refresh
  } = useOptimizedData('users', {
    limit: 100,
    sort: { created: -1 }
  });
  
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showStatusToggleModal, setShowStatusToggleModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [statusToggleUser, setStatusToggleUser] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [formData, setFormData] = useState({});
  const [pendingFormData, setPendingFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    role: ''
  });
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Loading states for confirmation modals
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);
  const [statusToggleLoading, setStatusToggleLoading] = useState(false);

  // Hooks
  const { user: currentUser } = useApp();

  // Role options - will be loaded from database
  const [roleOptions, setRoleOptions] = useState([
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' }
  ]);

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

  // Load users and roles on component mount
  useEffect(() => {
    loadRoles();
  }, []);

  // Filter users when search or filters change
  useEffect(() => {
    filterUsers();
  }, [users, searchValue, filters]);

  // Note: loadUsers function removed - now handled by useOptimizedData hook

  const loadRoles = async () => {
    try {
      // Load roles from database
      const rolesData = await apiClient.findObjects('roles', {});
      // Convert roles to options format
      const options = rolesData.map(role => ({
        value: role.name,
        label: role.name.charAt(0).toUpperCase() + role.name.slice(1)
      }));
      setRoleOptions(options);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Keep default role options if loading fails
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

    // Role filter - handle Relation objects
    if (filters.role) {
      filtered = filtered.filter(user => {
        if (Array.isArray(user.roles) && user.roles.length > 0) {
          return user.roles[0].name === filters.role;
        }
        if (typeof user.role === 'string') {
          return user.role === filters.role; // fallback for string roles
        }
        return false; // No role assigned
      });
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
    // Extract role name from Relation object
    let roleName = '';
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      roleName = user.roles[0].name || '';
    } else if (typeof user.role === 'string') {
      roleName = user.role;
    }
    
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: roleName,
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
    setPendingFormData(formData);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaveLoading(true);
    try {
      // Convert role name to Relation object
      const roleName = pendingFormData.role;
      let roleRelation = null;
      
      if (roleName) {
        // Find the role object by name
        const rolesData = await apiClient.findObjects('roles', { name: roleName });
        if (rolesData && rolesData.length > 0) {
          roleRelation = [{ id: rolesData[0].id }];
        }
      }
      
      // Prepare user data with Relation object
      const userData = {
        ...pendingFormData,
        roles: roleRelation
      };
      
      // Remove the role field since we're using roles Relation
      delete userData.role;
      
      if (editingUser) {
        // Update existing user
        await apiClient.updateObject('users', editingUser.id, userData);
        await auditLogger.logUpdate('user', editingUser.id, userData.username, {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          status: userData.status
        });
        toast.success('User updated successfully');
      } else {
        // Create new user
        const newUser = await apiClient.createObject('users', userData);
        await auditLogger.logCreate('user', newUser.id, userData.username, {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          status: userData.status
        });
        toast.success('User created successfully');
      }
      
      // Reload users from database
      await refresh();
      
      setShowFormModal(false);
      setFormData({});
      setEditingUser(null);
      setShowConfirmModal(false);
      setPendingFormData(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Failed to save user');
      setShowConfirmModal(false);
      setPendingFormData(null);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
    setPendingFormData(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      // Delete user from database
      await apiClient.deleteObject('users', deletingUser.id);
      await auditLogger.logDelete('user', deletingUser.id, deletingUser.username, {
        email: deletingUser.email,
        firstName: deletingUser.firstName,
        lastName: deletingUser.lastName
      });
      toast.success('User deleted successfully');
      
      // Reload users from database
      await refresh();
      
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const getRoleDisplayName = (role) => {
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
      const roleOption = roleOptions.find(option => option.value === role);
      return roleOption ? roleOption.label : role;
    }
    
    return 'No Role';
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
    const selectedUsers = filteredUsers.filter((user, index) => selectedRows.has(user.id || index));
    if (selectedUsers.length === 0) {
      toast.error('No users selected for export');
      return;
    }
    setShowExportModal(true);
  };

  const handleBulkDelete = () => {
    const selectedUsers = filteredUsers.filter((user, index) => selectedRows.has(user.id || index));
    if (selectedUsers.length === 0) {
      toast.error('No users selected for deletion');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    const selectedUsers = filteredUsers.filter((user, index) => selectedRows.has(user.id || index));
    if (selectedUsers.length === 0) return;

    setBulkDeleteLoading(true);
    try {
      // Delete selected users from database
      await Promise.all(
        selectedUsers.map(user => apiClient.deleteObject('users', user.id))
      );
      
      // Log bulk delete operation
      await auditLogger.log({
        action: 'delete',
        entity_type: 'user',
        entity_name: `${selectedUsers.length} users`,
        details: {
          count: selectedUsers.length,
          user_ids: selectedUsers.map(u => u.id),
          usernames: selectedUsers.map(u => u.username)
        },
        category: 'data_management',
        severity: 'warning'
      });
      
      setSelectedRows(new Set());
      setShowBulkDeleteModal(false);
      toast.success(`Deleted ${selectedUsers.length} users successfully`);
      
      // Reload users from database
      await refresh();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete users');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkStatusToggle = () => {
    const selectedUsers = filteredUsers.filter((user, index) => selectedRows.has(user.id || index));
    if (selectedUsers.length === 0) {
      toast.error('No users selected for status change');
      return;
    }
    
    // Determine new status based on first selected user
    const firstUser = selectedUsers[0];
    const newStatusValue = firstUser.status === 'active' ? 'inactive' : 'active';
    setNewStatus(newStatusValue);
    setShowBulkStatusModal(true);
  };

  const confirmBulkStatusToggle = async () => {
    const selectedUsers = filteredUsers.filter((user, index) => selectedRows.has(user.id || index));
    if (selectedUsers.length === 0) return;
    
    setBulkStatusLoading(true);
    try {
      // Update all selected users in database
      await Promise.all(
        selectedUsers.map(user => 
          apiClient.updateObject('users', user.id, { status: newStatus })
        )
      );
      
      // Log bulk status update operation
      await auditLogger.log({
        action: 'update',
        entity_type: 'user',
        entity_name: `${selectedUsers.length} users`,
        details: {
          count: selectedUsers.length,
          new_status: newStatus,
          user_ids: selectedUsers.map(u => u.id),
          usernames: selectedUsers.map(u => u.username)
        },
        category: 'data_management',
        severity: 'info'
      });
      
      setSelectedRows(new Set());
      setShowBulkStatusModal(false);
      toast.success(`Updated ${selectedUsers.length} users to ${newStatus}`);
      
      // Reload users from database
      await refresh();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setBulkStatusLoading(false);
    }
  };

  // Export functions
  const exportAsCSV = () => {
    const usersToExport = selectedRows.size > 0 
      ? filteredUsers.filter((user, index) => selectedRows.has(user.id || index))
      : filteredUsers;
    
    try {
      // Create CSV content
      const headers = ['Name', 'Username', 'Email', 'Role', 'Status', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...usersToExport.map(user => [
          `"${getUserDisplayName(user)}"`,
          `"${user.username}"`,
          `"${user.email}"`,
          `"${getRoleDisplayName(user.roles)}"`,
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
      
      setShowExportModal(false);
      toast.success(`Exported ${usersToExport.length} users as CSV successfully`);
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const exportAsPDF = () => {
    const usersToExport = selectedRows.size > 0 
      ? filteredUsers.filter((user, index) => selectedRows.has(user.id || index))
      : filteredUsers;
    
    // Close the export modal first
    setShowExportModal(false);
    
    // Create a print-specific stylesheet
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          margin: 0.5in;
          size: A4;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Create print content with table design
    const printElement = document.createElement('div');
    printElement.className = 'print-content';
    printElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">Users Export Report</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Total Users: ${usersToExport.length}</p>
        </div>
        
        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">#</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Name</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Username</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Email</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Role</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Status</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Created At</th>
            </tr>
          </thead>
          <tbody>
            ${usersToExport.map((user, index) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0;">${index + 1}</td>
                <td style="padding: 12px; color: #374151; font-weight: 500; border-right: 1px solid #e2e8f0;">${getUserDisplayName(user)}</td>
                <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0;">${user.username}</td>
                <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0;">${user.email}</td>
                <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0;">${getRoleDisplayName(user.roles)}</td>
                <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0;">${getStatusDisplayName(user.status)}</td>
                <td style="padding: 12px; color: #6b7280;">${new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    document.body.appendChild(printElement);
    
    // Trigger print
    setTimeout(() => {
      window.print();
      document.body.removeChild(printElement);
      document.head.removeChild(printStyles);
    }, 100);
    
    toast.success(`${usersToExport.length} user(s) exported as PDF successfully`);
  };

  // Individual user status toggle
  const handleUserStatusToggle = (user) => {
    const newStatusValue = user.status === 'active' ? 'inactive' : 'active';
    setStatusToggleUser(user);
    setNewStatus(newStatusValue);
    setShowStatusToggleModal(true);
  };

  const confirmUserStatusToggle = async () => {
    if (!statusToggleUser) return;
    
    setStatusToggleLoading(true);
    try {
      await apiClient.updateObject('users', statusToggleUser.id, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      
      // Reload users from database
      await refresh();
      
      setShowStatusToggleModal(false);
      setStatusToggleUser(null);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setStatusToggleLoading(false);
    }
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.roles)}`}>
          {getRoleDisplayName(user.roles)}
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

      {/* Progressive Loading with Skeleton */}
      <ProgressiveLoader
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={TableSkeleton}
      >
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
                  <p className="text-sm text-gray-900">{getRoleDisplayName(user.roles)}</p>
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
      </ProgressiveLoader>

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

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Confirm Save"
        message={`Are you sure you want to ${editingUser ? 'update' : 'create'} this user?`}
        confirmLabel={editingUser ? "Update User" : "Create User"}
        cancelLabel="Cancel"
        loading={saveLoading}
        variant="info"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
        loading={deleteLoading}
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
        loading={bulkDeleteLoading}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="danger"
      />

      {/* Bulk Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkStatusModal}
        onClose={() => setShowBulkStatusModal(false)}
        onConfirm={confirmBulkStatusToggle}
        title="Update User Status"
        message={`Are you sure you want to set ${selectedRows.size} selected users to ${newStatus}?`}
        confirmLabel={`Set to ${newStatus}`}
        cancelLabel="Cancel"
        loading={bulkStatusLoading}
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        variant="warning"
      />

      {/* Individual Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={showStatusToggleModal}
        onClose={() => setShowStatusToggleModal(false)}
        onConfirm={confirmUserStatusToggle}
        title="Update User Status"
        message={`Are you sure you want to set ${statusToggleUser ? getUserDisplayName(statusToggleUser) : 'this user'} to ${newStatus}?`}
        confirmLabel={`Set to ${newStatus}`}
        cancelLabel="Cancel"
        loading={statusToggleLoading}
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        variant="warning"
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
            setShowExportModal(true);
          }, color: 'bg-blue-600' }
        ]}
      />

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowExportModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRows.size > 0 ? 'Export Selected Users' : 'Export All Users'}
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose export format for {selectedRows.size > 0 ? selectedRows.size : filteredUsers.length} user(s):
                </p>
                <div className="space-y-3">
                  <Button
                    variant="primaryOutline"
                    size="md"
                    onClick={exportAsCSV}
                    className="w-full"
                  >
                    Export as CSV
                  </Button>
                  <Button
                    variant="secondaryOutline"
                    size="md"
                    onClick={exportAsPDF}
                    className="w-full"
                  >
                    Export as PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
