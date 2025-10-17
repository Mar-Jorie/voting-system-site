import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../AppContext';

const PublicRoute = ({ children }) => {
  const location = useLocation();
  const { user, setUser } = useContext(AppContext);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for stored user data on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionToken='))
        ?.split('=')[1];
        
      if (sessionToken && !user) {
        try {
          // Extract user ID from session token
          const tokenParts = sessionToken.split('_');
          if (tokenParts.length >= 2) {
            const userId = tokenParts[1];
            
            // Fetch the specific user from database using the user ID from session token
            const { getObject } = await import('../usecases/api');
            const userData = await getObject('users', userId);
            
            if (userData && userData.status === 'active') {
              setUser(userData);
            } else {
              // User no longer exists or is inactive, clear session
              document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            }
          } else {
            // Invalid session token format, clear session
            document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          }
        } catch (error) {
          // Error fetching user data - handled silently
          document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [user, setUser]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to username-based dashboard (prevent access to public pages)
  if (user) {
    // Get the intended destination from location state, or default to username dashboard
    const from = location.state?.from?.pathname || `/${user.username}`;
    return <Navigate to={from} replace />;
  }

  // If no user, render public content
  return children;
};

export default PublicRoute;
