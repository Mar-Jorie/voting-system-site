// Header Component - MANDATORY PATTERN
import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  Bars3Icon, 
  BellIcon, 
  ChevronDownIcon, 
  UserIcon, 
  QuestionMarkCircleIcon, 
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import MainLayout from './MainLayout';
import Button from '../Button';
import ConfirmationModal from '../ConfirmationModal';
import FormModal from '../FormModal';
import useApp from '../../hooks/useApp';
import { toast } from 'react-hot-toast';
import { updateObject } from '../../usecases/api';

const Header = () => {
  const { show, setShow, isMobile: _isMobile, isDesktop: _isDesktop } = useContext(MainLayout.Context);
  const { user, logout, refreshUser } = useApp();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showProfileUpdateConfirm, setShowProfileUpdateConfirm] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState(null);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowNotificationDropdown(false); // Close notification dropdown
  };

  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    setShowProfileDropdown(false); // Close profile dropdown
  };

  const handleProfileAction = (action) => {
    setShowProfileDropdown(false);
    if (action === 'profile') {
      setShowProfileModal(true);
    } else if (action === 'help') {
      setShowHelpModal(true);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleProfileUpdate = (formData) => {
    // Store the form data and show confirmation modal
    setPendingProfileData(formData);
    setShowProfileUpdateConfirm(true);
  };

  const confirmProfileUpdate = async () => {
    setProfileUpdateLoading(true);
    try {
      console.log('User object:', user);
      console.log('User ID:', user?.id);
      console.log('Pending profile data:', pendingProfileData);
      
      // Update user profile in database
      const updatedUser = await updateObject('users', user.id, {
        firstName: pendingProfileData.firstName,
        lastName: pendingProfileData.lastName,
        email: pendingProfileData.email,
        username: pendingProfileData.username
      });
      
      console.log('Update successful:', updatedUser);
      
      // Refresh user data from database to get the latest information
      await refreshUser();
      
      // Close modals and reset state
      setShowProfileUpdateConfirm(false);
      setIsEditingProfile(false);
      setPendingProfileData(null);
      
      // Show success toast
      toast.success('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        user: user,
        pendingData: pendingProfileData
      });
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'User';
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email || 'User';
  };

  const getUserRoleName = (user) => {
    if (!user) return 'Admin';
    return user.role?.name || 'Admin';
  };

  // Mock notifications data - in a real app, this would come from an API
  const notifications = [
    {
      id: 1,
      title: "New vote submitted",
      message: "A new vote has been submitted for the current election",
      time: "2 minutes ago",
      unread: true
    },
    {
      id: 2,
      title: "Election reminder",
      message: "Don't forget to cast your vote before the deadline",
      time: "1 hour ago",
      unread: true
    },
    {
      id: 3,
      title: "System update",
      message: "The voting system has been updated with new features",
      time: "3 hours ago",
      unread: true
    }
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 shadow-card">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Left: Hamburger Menu */}
          <div className="flex items-center">
            <button
              onClick={() => setShow(!show)}
              className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation relative z-50 min-w-[44px] min-h-[44px]"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Center: Empty - Logo Removed */}
          <div className="flex-1 flex justify-center">
            {/* Logo removed per user request */}
          </div>
          
          {/* Right: Notifications and Profile */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={handleNotificationClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notifications.filter(n => n.unread).length}
                </span>
              </button>

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          notification.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown - Responsive Content */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {getInitials(getUserDisplayName(user))}
                </div>
                {/* Desktop: Show name and role */}
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {getUserDisplayName(user) || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getUserRoleName(user) || 'Role'}
                  </div>
                </div>
                <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
              </button>

              {/* Profile Dropdown Menu - MANDATORY RESPONSIVE PATTERN */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {/* Desktop: View Profile + Help only */}
                  <div className="hidden lg:block">
                    <button 
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => handleProfileAction('profile')}
                    >
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span>View Profile</span>
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => handleProfileAction('help')}
                    >
                      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />
                      <span>Help & Support</span>
                    </button>
                  </div>
                  
                  {/* Mobile: View Profile + Help + Logout */}
                  <div className="lg:hidden">
                    <button 
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => handleProfileAction('profile')}
                    >
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span>View Profile</span>
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => handleProfileAction('help')}
                    >
                      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />
                      <span>Help & Support</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      onClick={() => setShowLogoutConfirm(true)}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        loading={logoutLoading}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        iconColor="text-red-600"
        iconBgColor="bg-red-100"
      />

      {/* Profile Update Confirmation Modal */}
      <ConfirmationModal
        isOpen={showProfileUpdateConfirm}
        onClose={() => {
          setShowProfileUpdateConfirm(false);
          setPendingProfileData(null);
        }}
        onConfirm={confirmProfileUpdate}
        title="Update Profile"
        message="Are you sure you want to update your profile information?"
        confirmLabel="Update Profile"
        cancelLabel="Cancel"
        loading={profileUpdateLoading}
        icon="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        variant="info"
      />

      {/* View Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => {
              setShowProfileModal(false);
              setIsEditingProfile(false);
            }}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-lg sm:max-w-xl overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl flex flex-col max-h-[90vh]">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Edit Profile"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setIsEditingProfile(false);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                {isEditingProfile ? (
                  /* Edit Mode - Use FormModal */
                  <FormModal
                    isOpen={true}
                    onClose={() => setIsEditingProfile(false)}
                    onSubmit={handleProfileUpdate}
                    title=""
                    fields={[
                      {
                        name: 'firstName',
                        label: 'First Name',
                        type: 'String',
                        required: true,
                        disabled: false
                      },
                      {
                        name: 'lastName',
                        label: 'Last Name',
                        type: 'String',
                        required: true,
                        disabled: false
                      },
                      {
                        name: 'email',
                        label: 'Email Address',
                        type: 'String',
                        format: 'email',
                        required: true,
                        disabled: false
                      },
                      {
                        name: 'username',
                        label: 'Username',
                        type: 'String',
                        required: true,
                        disabled: false
                      }
                    ]}
                    initialData={{
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      username: user?.username || ''
                    }}
                    submitButtonText="Save Changes"
                    isUpdate={true}
                  />
                ) : (
                  /* Display Mode */
                  <div className="space-y-6">
                    {/* Profile Avatar */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                        {getInitials(getUserDisplayName(user))}
                      </div>
                      <div className="text-center">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {getUserDisplayName(user)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getUserRoleName(user)}
                        </p>
                      </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Email Address</p>
                              <p className="text-sm text-gray-600">{user?.email || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Username</p>
                              <p className="text-sm text-gray-600">{user?.username || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer - Only show in display mode */}
              {!isEditingProfile && (
                <div className="flex justify-end p-6 border-t border-gray-200 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setShowProfileModal(false);
                      setIsEditingProfile(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowHelpModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-2xl overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl flex flex-col max-h-[90vh]">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Help & Support</h3>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Frequently Asked Questions</h4>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">How do I cast a vote?</h5>
                      <p className="text-sm text-gray-600">Navigate to the voting section, select your preferred candidate, and click the "Submit Vote" button.</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Can I change my vote?</h5>
                      <p className="text-sm text-gray-600">Once submitted, votes cannot be changed to ensure election integrity.</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">How do I view election results?</h5>
                      <p className="text-sm text-gray-600">Results are available after the election period ends. Check the results section for updates.</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">What if I forget my password?</h5>
                      <p className="text-sm text-gray-600">Contact the system administrator to reset your password. You can reach them through the contact information below.</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">How secure is the voting system?</h5>
                      <p className="text-sm text-gray-600">Our voting system uses industry-standard encryption and security measures to ensure your vote is protected and anonymous.</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Can I vote from my mobile device?</h5>
                      <p className="text-sm text-gray-600">Yes, the voting system is fully responsive and works on all devices including smartphones and tablets.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Contact Support</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Support</p>
                        <p className="text-xs text-gray-600">support@votingsystem.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <PhoneIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone Support</p>
                        <p className="text-xs text-gray-600">+1 (555) 123-4567</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">System Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Version:</span>
                        <span className="ml-2 font-medium">1.0.0</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="ml-2 font-medium">Today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 flex-shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowHelpModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;