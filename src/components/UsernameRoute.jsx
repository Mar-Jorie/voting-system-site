import React, { useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AppContext } from '../AppContext';
import ProtectedRoute from '../pages/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import DashboardPage from '../pages/DashboardPage';
import CandidatesPage from '../pages/CandidatesPage';
import FAQPage from '../pages/FAQPage';
import VotesListPage from '../pages/VotesListPage';
import UsersPage from '../pages/UsersPage';

const UsernameRoute = ({ page }) => {
  const { user } = useContext(AppContext);
  const { username } = useParams();

  // Check if the username in URL matches the logged-in user
  if (!user || user.username !== username) {
    return <Navigate to="/" replace />;
  }

  // Render the appropriate page based on the route
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage />;
      case 'candidates':
        return <CandidatesPage />;
      case 'faq':
        return <FAQPage />;
      case 'votes':
        return <VotesListPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        {renderPage()}
      </MainLayout>
    </ProtectedRoute>
  );
};

export default UsernameRoute;
