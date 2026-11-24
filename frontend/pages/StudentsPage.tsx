import React, { useState, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';

interface StudentRecord {
  id: string;
  rollNo: string;
  name: string;
  father_name?: string;
  mother_name?: string;
  department: string;
  year: number;
  semester?: string;
  phone?: string;
  email?: string;
  contact?: string;
}

const API_URL = 'http://localhost:5000/api/students';

const DEPARTMENT_SEMESTERS: Record<string, number> = {
  BCA: 6,
  'B.Tech': 8,
  Polytechnic: 4,
  BBA: 6,
  'B.Sc': 6,
  MCA: 4,
};

const getSemestersForDept = (dept: string): string[] => {
  const count = DEPARTMENT_SEMESTERS[dept] || 6;
  return Array.from({ length: count }, (_, i) => `Sem ${i + 1}`);
};


const StudentsPage: React.FC = () => {
  const { user, token } = useAuth();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    father_name: '',
    mother_name: '',
    department: 'BCA',
    year: 1,
    semester: 'Sem 1',
    phone: '',
    email: '',
    username: '',
    password: '',
  });

  // Load all student records
  const fetchStudents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((s) => (filterDept ? s.department === filterDept : true))
      .filter((s) => (filterSem ? (s.semester || 'Sem 1') === filterSem : true));
  }, [students, searchTerm, filterDept, filterSem]);

  const departments = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.department).filter(Boolean)));
  }, [students]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      rollNo: '',
      name: '',
      father_name: '',
      mother_name: '',
      department: 'BCA',
      year: 1,
      semester: 'Sem 1',
      phone: '',
      email: '',
      username: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: StudentRecord) => {
    setEditingStudent(student);
    setFormData({
      rollNo: student.rollNo,
      name: student.name,
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      department: student.department || 'BCA',
      year: student.year || 1,
      semester: student.semester || 'Sem 1',
      phone: student.phone || '',
      email: student.email || student.contact || '',
      username: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  // Create or update student record
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const url = editingStudent ? `${API_URL}/${editingStudent.id}` : API_URL;
      const method = editingStudent ? 'PUT' : 'POST';
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
      await fetchStudents();
      setIsModalOpen(false);
    } catch {
      alert('Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student and their login account?')) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert('Failed to delete student.');
      }
    } catch {
      alert('Failed to delete student.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage student profiles, family details &amp; contact information
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20"
          >
            + Add Student
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or roll no..."
          className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-slate-200 focus:outline-none focus:border-amber-400"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-slate-200 focus:outline-none focus:border-amber-400"
          value={filterSem}
          onChange={(e) => setFilterSem(e.target.value)}
        >
          <option value="">All Semesters</option>
          {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'].map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#12161c]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
            <tr>
              <th className="px-4 py-3.5">Roll No</th>
              <th className="px-4 py-3.5">Name</th>
              <th className="px-4 py-3.5">Father&apos;s Name</th>
              <th className="px-4 py-3.5">Mother&apos;s Name</th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Semester</th>
              <th className="px-4 py-3.5">Mobile</th>
              <th className="px-4 py-3.5">Email</th>
              {canManage && <th className="px-4 py-3.5">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} className="text-center py-6 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} className="text-center py-6 text-slate-400">
                  No students found. Click &quot;+ Add Student&quot; to create one.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                  <td className="px-4 py-4 font-semibold text-amber-300">{student.rollNo}</td>
                  <td className="px-4 py-4 text-white font-medium">{student.name}</td>
                  <td className="px-4 py-4">{student.father_name || '-'}</td>
                  <td className="px-4 py-4">{student.mother_name || '-'}</td>
                  <td className="px-4 py-4">{student.department}</td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {student.semester || 'Sem 1'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{student.phone || '-'}</td>
                  <td className="px-4 py-4 text-slate-400">{student.email || student.contact || '-'}</td>
                  {canManage && (
                    <td className="px-4 py-4 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        title="Edit Student"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {user?.role === ROLES.ADMIN && (
                        <button
                          type="button"
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          title="Delete Student"
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
          <div className="w-full max-w-lg rounded-2xl bg-[#161a22] border border-white/15 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Roll No *</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Father&apos;s Name</label>
                  <input
                    type="text"
                    placeholder="Father's full name"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Mother&apos;s Name</label>
                  <input
                    type="text"
                    placeholder="Mother's full name"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Department</label>
                  <select
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#1c212b] border border-white/10 text-white text-sm"
                    value={formData.department}
                    onChange={(e) => {
                      const nextDept = e.target.value;
                      const validSems = getSemestersForDept(nextDept);
                      const nextSem = validSems.includes(formData.semester) ? formData.semester : 'Sem 1';
                      setFormData({ ...formData, department: nextDept, semester: nextSem });
                    }}
                  >
                    {Object.keys(DEPARTMENT_SEMESTERS).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Semester</label>
                  <select
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#1c212b] border border-white/10 text-white text-sm"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  >
                    {getSemestersForDept(formData.department).map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {!editingStudent && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-amber-400 mb-2">Optional: Create Student Login Account</p>
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
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm"
                >
                  {saving ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;