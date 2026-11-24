import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BuildingLibraryIcon } from '@heroicons/react/24/solid';
import { Role } from '../types';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Student);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    setLoading(true);
    try {
      const result = await register({ name, username, password, role });
      if (result.user) {
        navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
      } else {
        setError(result.error || 'An unknown error occurred.');
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
              Create a new account
            </h2>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                    </label>
                    <div className="mt-1">
                    <input id="name" name="name" type="text" required
                        className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-white"
                        value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                </div>
                 <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                    </label>
                    <div className="mt-1">
                    <input id="username" name="username" type="text" required
                        className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-white"
                        value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                    </label>
                    <div className="mt-1">
                    <input id="password-input" name="password" type="password" required
                        className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-white"
                        value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                </div>
                
                 <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    I am a...
                    </label>
                    <div className="mt-1">
                    <select id="role" name="role" required value={role} onChange={(e) => setRole(e.target.value as Role)}
                        className="block w-full rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-white">
                        <option value={Role.Student}>Student</option>
                        <option value={Role.Teacher}>Teacher</option>
                        <option value={Role.Admin}>Admin</option>
                    </select>
                    </div>
                </div>
                
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <div>
                    <button type="submit" disabled={loading}
                    className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
                    {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </div>
            </form>
            <div className="mt-6 text-center text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;