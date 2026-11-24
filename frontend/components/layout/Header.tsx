import React from 'react';
import {
  HomeIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigate directly to the main dashboard
  const handleHome = () => {
    navigate('/dashboard');
  };

  // Sign out and return to the login page
  const handleLoginPage = () => {
    if (window.confirm('Are you sure you want to log out of your account?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md px-4 py-3 flex flex-wrap justify-between items-center gap-3">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          College Management System
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={handleHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition"
          title="Go to Home Dashboard"
        >
          <HomeIcon className="h-4 w-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={handleLoginPage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          title="Return to Login Page"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span>Log Out</span>
        </button>

        <div className="text-right pl-2 border-l border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
