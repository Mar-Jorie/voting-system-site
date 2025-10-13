// Header Component - MANDATORY PATTERN
import React, { useState, useContext } from 'react';
import { 
  Bars3Icon, 
  BellIcon, 
  ChevronDownIcon, 
  UserIcon, 
  QuestionMarkCircleIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import MainLayout from './MainLayout';
import Button from '../Button';
import ConfirmationModal from '../ConfirmationModal';
import useApp from '../../hooks/useApp';

const Header = () => {
  const { show, setShow, isMobile: _isMobile, isDesktop: _isDesktop } = useContext(MainLayout.Context);
  const { user, logout } = useApp();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfileAction = (action) => {
    setShowProfileDropdown(false);
    if (action === 'profile') {
      // Navigate to profile page
      console.log('Navigate to profile');
    } else if (action === 'help') {
      // Navigate to help page
      console.log('Navigate to help');
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'User';
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email || 'User';
  };

  const getUserRoleName = (user) => {
    if (!user) return 'User';
    return user.role?.name || 'User';
  };

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
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center">
              <BellIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile Dropdown - Responsive Content */}
            <div className="relative">
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
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        iconColor="text-red-600"
        iconBgColor="bg-red-100"
      />
    </>
  );
};

export default Header;