import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';
import { Course } from '../types';

const API_URL = 'http://localhost:5000/api/courses';

const CoursesPage: React.FC = () => {
  const { user, token } = useAuth();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    name: '',
    department: 'BCA',
    credits: 4,
  });

  const fetchCourses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({ courseId: '', name: '', department: 'BCA', credits: 4 });
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      courseId: course.courseId,
      name: course.name,
      department: course.department,
      credits: Number(course.credits) || 4,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const url = editingCourse ? `${API_URL}/${editingCourse.id}` : API_URL;
      const method = editingCourse ? 'PUT' : 'POST';
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
      await fetchCourses();
      setIsModalOpen(false);
    } catch {
      alert('Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert('Failed to delete course.');
      }
    } catch {
      alert('Failed to delete course.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-sm text-slate-400 mt-1">Manage subjects, credits &amp; departments</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20"
          >
            + Add Course
          </button>
        )}
      </div>

      <div className="bg-[#12161c]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
            <tr>
              <th className="px-6 py-3.5">Course ID</th>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Credits</th>
              {canManage && <th className="px-6 py-3.5">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">No courses found. Click &quot;+ Add Course&quot; to create one.</td></tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                  <td className="px-6 py-4 font-semibold text-amber-300">{course.courseId}</td>
                  <td className="px-6 py-4 text-white font-medium">{course.name}</td>
                  <td className="px-6 py-4">{course.department}</td>
                  <td className="px-6 py-4">{course.credits}</td>
                  {canManage && (
                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(course)}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        title="Edit Course"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {user?.role === ROLES.ADMIN && (
                        <button
                          type="button"
                          onClick={() => handleDelete(course.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          title="Delete Course"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
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
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Course ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA-507"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minor Project / Web Development"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Department *</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Credits *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm">
                  {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
