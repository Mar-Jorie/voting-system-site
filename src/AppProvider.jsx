import React, { useState, useEffect } from "react";
import { AppContext } from "./AppContext";

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
  
  const value = {
    user,
    setUser,
    schemas,
    setSchemas,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
