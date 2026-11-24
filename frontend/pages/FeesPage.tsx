import React, { useEffect, useState } from 'react';
import { BanknotesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';

interface StudentFee {
  id: string;
  rollNo: string;
  name: string;
  department: string;
  semester?: string;
  year: number;
  contact: string;
  total_fee?: number;
  paid_fee?: number;
}

const API_URL = 'http://localhost:5000/api/students';

const FeesPage: React.FC = () => {
  const { user, token } = useAuth();
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [myProfile, setMyProfile] = useState<StudentFee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingFee, setEditingFee] = useState<StudentFee | null>(null);
  const [totalFee, setTotalFee] = useState(0);
  const [paidFee, setPaidFee] = useState(0);
  const [saving, setSaving] = useState(false);

  const isStudent = user?.role === ROLES.STUDENT;

  const loadFees = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (isStudent) {
        const res = await fetch(`${API_URL}/me`, { headers: { Authorization: 'Bearer ' + token } });
        if (res.ok) {
          setMyProfile(await res.json());
        } else {
          setMyProfile(null);
        }
      } else {
        const res = await fetch(API_URL, { headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [token, user?.role]);

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/${editingFee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          name: editingFee.name,
          rollNo: editingFee.rollNo,
          department: editingFee.department,
          year: editingFee.year,
          semester: editingFee.semester || 'Sem 1',
          contact: editingFee.contact || '',
          total_fee: totalFee,
          paid_fee: paidFee,
        }),
      });
      if (res.ok) {
        await loadFees();
        setEditingFee(null);
      } else {
        alert('Failed to update fee.');
      }
    } catch {
      alert('Failed to update fee.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Loading fee details...</div>;
  }

  if (isStudent) {
    const total = Number(myProfile?.total_fee) || 0;
    const paid = Number(myProfile?.paid_fee) || 0;
    const remaining = Math.max(0, total - paid);
    const status = total > 0 && remaining === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BanknotesIcon className="h-8 w-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">My Fee Status</h1>
            <p className="text-sm text-slate-400">Check your total, paid, and remaining fee balance</p>
          </div>
        </div>

        {!myProfile ? (
          <div className="p-6 rounded-2xl bg-[#12161c]/80 border border-white/10 text-slate-300">
            Your login account is not linked to a student fee record yet. Ask Admin to link your account from the Students page.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-[#12161c]/80 border border-white/10">
                <p className="text-xs uppercase text-slate-400">Total Fee</p>
                <p className="text-2xl font-bold text-white mt-1">₹{total.toLocaleString()}</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#12161c]/80 border border-emerald-500/20">
                <p className="text-xs uppercase text-emerald-400">Paid Fee</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1">₹{paid.toLocaleString()}</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#12161c]/80 border border-red-500/20">
                <p className="text-xs uppercase text-red-400">Remaining Fee</p>
                <p className="text-2xl font-bold text-red-300 mt-1">₹{remaining.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#12161c]/80 border border-white/10 space-y-2 text-sm text-slate-300">
              <p><span className="text-slate-400">Student Name:</span> <strong className="text-white">{myProfile.name}</strong></p>
              <p><span className="text-slate-400">Roll No:</span> <strong className="text-amber-300">{myProfile.rollNo}</strong></p>
              <p><span className="text-slate-400">Department / Semester:</span> {myProfile.department} — {myProfile.semester || 'Sem 1'}</p>
              <p><span className="text-slate-400">Status:</span> <strong className="text-white">{status}</strong></p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BanknotesIcon className="h-8 w-8 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Fee Management</h1>
          <p className="text-sm text-slate-400">Track student total, paid &amp; remaining fees</p>
        </div>
      </div>

      <div className="bg-[#12161c]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
            <tr>
              <th className="px-5 py-3.5">Roll No</th>
              <th className="px-5 py-3.5">Student</th>
              <th className="px-5 py-3.5">Total Fee</th>
              <th className="px-5 py-3.5">Paid Fee</th>
              <th className="px-5 py-3.5">Remaining Fee</th>
              <th className="px-5 py-3.5">Status</th>
              {!isStudent && <th className="px-5 py-3.5">Action</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const total = Number(s.total_fee) || 0;
              const paid = Number(s.paid_fee) || 0;
              const remaining = Math.max(0, total - paid);
              const status = total > 0 && remaining === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
              return (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-semibold text-amber-300">{s.rollNo}</td>
                  <td className="px-5 py-4 text-white font-medium">{s.name}</td>
                  <td className="px-5 py-4">₹{total.toLocaleString()}</td>
                  <td className="px-5 py-4 text-emerald-300">₹{paid.toLocaleString()}</td>
                  <td className="px-5 py-4 text-red-300">₹{remaining.toLocaleString()}</td>
                  <td className="px-5 py-4">{status}</td>
                  {!isStudent && (
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFee(s);
                          setTotalFee(total);
                          setPaidFee(paid);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold"
                      >
                        Update Fee
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#161a22] border border-white/15 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Update Fee — {editingFee.name}</h2>
              <button type="button" onClick={() => setEditingFee(null)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateFee} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Total Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  value={totalFee}
                  onChange={(e) => setTotalFee(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Paid Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  value={paidFee}
                  onChange={(e) => setPaidFee(Number(e.target.value))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingFee(null)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm">
                  {saving ? 'Saving...' : 'Save Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesPage;
