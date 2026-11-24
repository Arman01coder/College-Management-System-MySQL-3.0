import React, { useState, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { Teacher } from '../types';

const API_URL = 'http://localhost:5000/api/teachers';

const TeachersPage: React.FC = () => {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    teacherId: '',
    name: '',
    department: 'Computer Science',
    subjects: '',
    contact: '',
    username: '',
    password: '',
  });

  const fetchTeachers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [token]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      teacherId: '',
      name: '',
      department: 'Computer Science',
      subjects: '',
      contact: '',
      username: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      teacherId: teacher.teacherId,
      name: teacher.name,
      department: teacher.department || 'Computer Science',
      subjects: Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : String(teacher.subjects || ''),
      contact: teacher.contact || '',
      username: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const url = editingTeacher ? `${API_URL}/${editingTeacher.id}` : API_URL;
      const method = editingTeacher ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Operation failed');
        return;
      }
      await fetchTeachers();
      setIsModalOpen(false);
    } catch {
      alert('Failed to save teacher.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert('Failed to delete teacher.');
      }
    } catch {
      alert('Failed to delete teacher.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Teachers</h1>
          <p className="text-sm text-slate-400 mt-1">Manage faculty profiles &amp; subjects</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20"
        >
          + Add Teacher
        </button>
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name or Teacher ID..."
          className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#12161c]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
            <tr>
              <th className="px-6 py-3.5">Teacher ID</th>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Subjects</th>
              <th className="px-6 py-3.5">Contact</th>
              <th className="px-6 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : filteredTeachers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400">No teachers found. Click &quot;+ Add Teacher&quot; to create one.</td></tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                  <td className="px-6 py-4 font-semibold text-amber-300">{teacher.teacherId}</td>
                  <td className="px-6 py-4 text-white font-medium">{teacher.name}</td>
                  <td className="px-6 py-4">{teacher.department}</td>
                  <td className="px-6 py-4">
                    {Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : teacher.subjects || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{teacher.contact}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(teacher)}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      title="Edit Teacher"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(teacher.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      title="Delete Teacher"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#161a22] border border-white/15 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Teacher ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCH-101"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Department</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Subjects (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. DBMS, Web Dev, Java"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Contact / Email</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
              {!editingTeacher && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-amber-400 mb-2">Optional: Create Teacher Login Account</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Username"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm">
                  {saving ? 'Saving...' : editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;
