import React, { useState } from "react";
import { AppContext } from "./AppContext";

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [schemas, setSchemas] = useState([]);
  
  const value = {
    user,
    setUser,
    schemas,
    setSchemas,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
