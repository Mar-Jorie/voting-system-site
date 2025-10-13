import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useApp from '../hooks/useApp';
import MainLayout from '../components/layout/MainLayout';
import VotingInterface from '../components/VotingInterface';
import AdminPanel from '../components/AdminPanel';
// import { toast } from 'react-hot-toast';

const MainPage = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('voting');

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/signin');
      return;
    }

    // Check if user is admin to show admin panel
    const userData = JSON.parse(storedUser);
    if (userData.role === 'admin') {
      setCurrentView('admin');
    }
  }, [navigate]);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
            {currentView === 'admin' ? 'Admin Panel' : 'Voting System'}
          </h1>
          <p className="text-gray-600">
            {currentView === 'admin' 
              ? 'Manage candidates and view voting results' 
              : 'Cast your vote for your preferred candidates'
            }
          </p>
        </div>

        {/* View Toggle for Admin Users */}
        {user.role === 'admin' && (
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => handleViewChange('voting')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'voting'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Voting Interface
              </button>
              <button
                onClick={() => handleViewChange('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'admin'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Admin Panel
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {currentView === 'voting' ? (
            <VotingInterface />
          ) : (
            <AdminPanel />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MainPage;