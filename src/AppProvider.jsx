import React, { useState, useEffect } from "react";
import { AppContext } from "./AppContext";
import { toast } from "react-hot-toast";
import auditLogger from "./utils/auditLogger.js";

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [schemas, setSchemas] = useState([]);
  
  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
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
  
  const value = {
    user,
    setUser,
    schemas,
    setSchemas,
    logout,
    login,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
