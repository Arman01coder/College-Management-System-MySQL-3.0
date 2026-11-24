import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BuildingLibraryIcon } from '@heroicons/react/24/solid';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state so the message doesn't reappear on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const user = await login({ username, password });
      if (user) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <BuildingLibraryIcon className="mx-auto h-12 w-auto text-primary-600" />
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
             <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Hint: admin/password, teacher/password, or student/password
            </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                    </label>
                    <div className="mt-1">
                    <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-white"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    </div>
                </div>

                <div>
                    <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                    </label>
                    <div className="mt-1">
                    <input
                        id="password-input"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>
                </div>
                
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                {successMessage && <p className="text-sm text-green-500 text-center">{successMessage}</p>}

                <div>
                    <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                    {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                        New to the portal?
                    </span>
                    </div>
                </div>

                <div className="mt-6">
                    <Link
                    to="/register"
                    className="flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                    Sign up
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;