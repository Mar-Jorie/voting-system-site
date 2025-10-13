// NavSidebar Component - MANDATORY PATTERN
import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  GlobeAltIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import MainLayout from './MainLayout';
import Button from '../Button';
import ConfirmationModal from '../ConfirmationModal';
import useApp from '../../hooks/useApp';

const NavSidebar = () => {
  const { isMobile, setShow } = useContext(MainLayout.Context);
  const { user, logout } = useApp();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavClick = () => {
    if (isMobile) {
      setShow(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
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

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard' || location.pathname === '/'
    },
    {
      name: 'Candidates',
      href: '/candidates',
      icon: GlobeAltIcon,
      current: location.pathname === '/candidates'
    },
    {
      name: 'Voting',
      href: '/voting',
      icon: DocumentTextIcon,
      current: location.pathname === '/voting'
    },
    {
      name: 'Results',
      href: '/results',
      icon: ChartBarIcon,
      current: location.pathname === '/results'
    }
  ];

  return (
    <div className="bg-white border-r border-gray-200 h-full w-80 max-w-[80vw] lg:w-[270px]">
      <div className="flex flex-col h-full">
        {/* Header Section - Responsive */}
        <div className="flex flex-col p-6 border-b border-gray-200">
          {/* Mobile: User Profile */}
          <div className="lg:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                {getInitials(getUserDisplayName(user))}
              </div>
              <div>
                <h1 className="text-base font-medium text-gray-900">
                  {getUserDisplayName(user)}
                </h1>
                <p className="text-xs text-gray-500">
                  {getUserRoleName(user)}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop: System Logo and Name */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-base font-medium text-gray-900">
                  Voting System
                </h1>
                <p className="text-xs text-gray-500">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                item.current
                  ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 mr-3 ${
                item.current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        {/* Footer - Logout button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogoutClick}
            variant="primaryOutline"
            size="md"
            className="w-full"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

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
    </div>
  );
};

export default NavSidebar;