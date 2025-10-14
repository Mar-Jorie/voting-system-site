import React, { useState, useEffect } from "react";
import { AppContext } from "./AppContext";
import { toast } from "react-hot-toast";
import auditLogger from "./utils/auditLogger.js";
import { getCurrentUser } from "./usecases/api";

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [schemas, setSchemas] = useState([]);
  
  // Load user from database on app start (real-time data)
  useEffect(() => {
    const loadUserFromDatabase = async () => {
      try {
        // First check if we have a stored user token/session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // If we have stored user data, fetch fresh data from database
            const freshUserData = await getCurrentUser();
            console.log('Fresh user data from database:', freshUserData);
            
            // Update user state with fresh database data
            setUser(freshUserData);
            
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify(freshUserData));
            
          } catch (error) {
            console.error('Error fetching fresh user data:', error);
            // If database fetch fails, use stored data as fallback
            const userData = JSON.parse(storedUser);
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('user');
      }
    };

    loadUserFromDatabase();
  }, []);

  // Session validation - check if user is still valid on page focus/visibility change
  useEffect(() => {
    const validateSession = () => {
      if (user) {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          // User data was cleared from localStorage, logout
          setUser(null);
          window.location.href = '/signin';
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
  }, [user]);

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
    // Log logout event
    if (user?.email) {
      await auditLogger.logLogout(user.email);
    }
    
    // Clear user data from state
    setUser(null);
    
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Clear any other session data
    localStorage.removeItem('candidates');
    localStorage.removeItem('votes');
    
    // Show success message
    toast.success('You have been signed out successfully');
    
    // Redirect to signin page
    window.location.href = '/signin';
  };

  // Login function
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  // Function to refresh user data from database
  const refreshUser = async () => {
    try {
      const freshUserData = await getCurrentUser();
      console.log('Refreshing user data from database:', freshUserData);
      setUser(freshUserData);
      localStorage.setItem('user', JSON.stringify(freshUserData));
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
