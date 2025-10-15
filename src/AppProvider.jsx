import React, { useState, useEffect } from "react";
import { AppContext } from "./AppContext";
import { toast } from "react-hot-toast";
import auditLogger from "./utils/auditLogger.js";

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [schemas, setSchemas] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastValidationTime, setLastValidationTime] = useState(0);
  
  // Load user from database on app start (real-time data)
  useEffect(() => {
    const loadUserFromDatabase = async () => {
      try {
        // Check if we have a session token in cookies (more secure than localStorage)
        const sessionToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('sessionToken='))
          ?.split('=')[1];
          
        if (sessionToken) {
          // Extract user ID from session token (format: session_userId_timestamp_random)
          const tokenParts = sessionToken.split('_');
          if (tokenParts.length >= 2) {
            const userId = tokenParts[1];
            
            // Fetch the specific user from database using the user ID from session token
            const { getObject } = await import('./usecases/api');
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
        }
      } catch (error) {
        console.error('Error loading user from database:', error);
        // Clear any invalid session data
        document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    };

    loadUserFromDatabase();
  }, []);

  // Session validation - check if user is still valid on page focus/visibility change
  useEffect(() => {
    const validateSession = async () => {
      // Skip validation if we're in the process of logging out
      if (isLoggingOut) {
        return;
      }
      
      // Throttle validation to prevent too frequent calls (max once per 5 seconds)
      const now = Date.now();
      if (now - lastValidationTime < 5000) {
        return;
      }
      setLastValidationTime(now);
      
      // Check if we have a session token in cookies
      const sessionToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionToken='))
        ?.split('=')[1];
      
      // If no session token, ensure user state is null and redirect to signin
      if (!sessionToken) {
        if (user) {
          setUser(null);
          window.location.replace('/signin');
        }
        return;
      }
      
      // If we have a user in state, validate it
      if (user) {
        try {
          // Extract user ID from session token
          const tokenParts = sessionToken.split('_');
          if (tokenParts.length >= 2) {
            const userId = tokenParts[1];
            
            // Verify the specific user still exists and is active in database
            const { getObject } = await import('./usecases/api');
            const userData = await getObject('users', userId);
            
            if (!userData || userData.status !== 'active') {
              // User no longer exists or is inactive, logout
              setUser(null);
              document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              window.location.replace('/signin');
            } else {
              // Update user state with fresh data
              setUser(userData);
            }
          } else {
            // Invalid session token format, logout
            setUser(null);
            document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.replace('/signin');
          }
        } catch (error) {
          console.error('Error validating session:', error);
          // If validation fails, logout
          setUser(null);
          document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.replace('/signin');
        }
      }
    };

    // Check session on page focus
    window.addEventListener('focus', validateSession);
    // Check session on visibility change
    document.addEventListener('visibilitychange', validateSession);
    
    return () => {
      window.removeEventListener('focus', validateSession);
      document.removeEventListener('visibilitychange', validateSession);
    };
  }, [user, isLoggingOut, lastValidationTime]);

  // Prevent back button navigation to public routes when authenticated
  useEffect(() => {
    const handlePopState = (event) => {
      if (user) {
        const currentPath = window.location.pathname;
        const publicRoutes = ['/', '/signin'];
        
        if (publicRoutes.includes(currentPath)) {
          // If user tries to go back to public route, redirect to dashboard
          window.history.pushState(null, '', '/dashboard');
          window.location.reload();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Logout function
  const logout = async () => {
    try {
      // Set logging out flag to prevent session validation interference
      setIsLoggingOut(true);
      
      // Log logout event
      if (user?.email) {
        await auditLogger.logLogout(user.email);
      }
      
      // Clear user data from state
      setUser(null);
      
      // Clear session token from cookies
      document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Clear any other session data
      localStorage.removeItem('candidates');
      localStorage.removeItem('votes');
      
      // Show success message
      toast.success('You have been signed out successfully');
      
      // Use window.location.replace instead of href to prevent back button issues
      // and ensure a clean redirect without history
      window.location.replace('/signin');
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, still clear the session
      setUser(null);
      document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.removeItem('candidates');
      localStorage.removeItem('votes');
      window.location.replace('/signin');
    }
  };

  // Login function
  const login = (userData) => {
    setUser(userData);
    // Set session token in cookies with user ID for proper session management
    const sessionToken = `session_${userData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    document.cookie = `sessionToken=${sessionToken}; path=/; max-age=86400`; // 24 hours
  };
  
  // Function to refresh user data from database
  const refreshUser = async () => {
    try {
      // Check if we have a session token
      const sessionToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionToken='))
        ?.split('=')[1];
        
      if (!sessionToken) {
        throw new Error('No user session found');
      }
      
      // Extract user ID from session token
      const tokenParts = sessionToken.split('_');
      if (tokenParts.length < 2) {
        throw new Error('Invalid session token format');
      }
      
      const userId = tokenParts[1];
      
      // Fetch fresh user data from database using the specific user ID
      const { getObject } = await import('./usecases/api');
      const freshUserData = await getObject('users', userId);
      
      if (!freshUserData || freshUserData.status !== 'active') {
        throw new Error('User not found or inactive');
      }
      console.log('Refreshing user data from database:', freshUserData);
      
      setUser(freshUserData);
      return freshUserData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    schemas,
    setSchemas,
    logout,
    login,
    refreshUser,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
