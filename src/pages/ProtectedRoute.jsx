import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../AppContext';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useContext(AppContext);

  return user ? (
    children
  ) : (
    <Navigate to="/signin" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
