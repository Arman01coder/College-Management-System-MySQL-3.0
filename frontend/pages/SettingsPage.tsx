import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';

const API_BASE = 'http://localhost:5000/api';

const SettingsPage: React.FC = () => {
  const { user, token } = useAuth();
  const isStudent = user?.role === ROLES.STUDENT;

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactSaving, setContactSaving] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactErr, setContactErr] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [userSaving, setUserSaving] = useState(false);
  const [userMsg, setUserMsg] = useState('');
  const [userErr, setUserErr] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  // Load current student contact details
  useEffect(() => {
    if (!token || !isStudent) return;
    fetch(`${API_BASE}/students/me`, {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPhone(data.phone || '');
          setEmail(data.email || data.contact || '');
        }
      })
      .catch(() => {});
  }, [token, isStudent]);

  // Update mobile number and email for student
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setContactSaving(true);
    setContactMsg('');
    setContactErr('');
    try {
      const res = await fetch(`${API_BASE}/students/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ phone, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setContactMsg('Contact details updated successfully.');
      } else {
        setContactErr(data.message || 'Failed to update contact details.');
      }
    } catch {
      setContactErr('Failed to update contact details.');
    } finally {
      setContactSaving(false);
    }
  };

  // Change account username without affecting Roll No or attendance records
  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUserSaving(true);
    setUserMsg('');
    setUserErr('');
    try {
      const res = await fetch(`${API_BASE}/auth/change-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ newUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserMsg(`Username updated to "${data.username}". Use it on your next Sign In.`);
        setNewUsername('');
      } else {
        setUserErr(data.message || 'Failed to update username.');
      }
    } catch {
      setUserErr('Failed to update username.');
    } finally {
      setUserSaving(false);
    }
  };

  // Change account password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 6) {
      setPwErr('New password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    setPwMsg('');
    setPwErr('');
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg(data.message || 'Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPwErr(data.message || 'Failed to change password.');
      }
    } catch {
      setPwErr('Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center space-x-3">
        <Cog6ToothIcon className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Update your profile contact details, username, and password
          </p>
        </div>
      </div>

      {isStudent && (
        <form
          onSubmit={handleUpdateContact}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Update Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter mobile number"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          {contactErr && <p className="text-sm text-red-500">{contactErr}</p>}
          {contactMsg && <p className="text-sm text-green-600 dark:text-green-400">{contactMsg}</p>}
          <button
            type="submit"
            disabled={contactSaving}
            className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition"
          >
            {contactSaving ? 'Saving...' : 'Save Contact'}
          </button>
        </form>
      )}

      <form
        onSubmit={handleChangeUsername}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Change Username</h2>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New Username</label>
          <input
            type="text"
            required
            placeholder="Enter new username (min 3 characters)"
            className="w-full sm:w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
        </div>
        {userErr && <p className="text-sm text-red-500">{userErr}</p>}
        {userMsg && <p className="text-sm text-green-600 dark:text-green-400">{userMsg}</p>}
        <button
          type="submit"
          disabled={userSaving}
          className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition"
        >
          {userSaving ? 'Updating...' : 'Update Username'}
        </button>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Change Password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              required
              placeholder="Enter current password"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              required
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
        {pwErr && <p className="text-sm text-red-500">{pwErr}</p>}
        {pwMsg && <p className="text-sm text-green-600 dark:text-green-400">{pwMsg}</p>}
        <button
          type="submit"
          disabled={pwSaving}
          className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-semibold transition"
        >
          {pwSaving ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;