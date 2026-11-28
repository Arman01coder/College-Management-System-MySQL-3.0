import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';

interface CourseItem {
  id: string;
  courseId: string;
  name: string;
  department: string;
}

interface StudentItem {
  id: string;
  rollNo: string;
  name: string;
  department: string;
}

interface AttendanceRecord {
  id: string;
  studentId?: string;
  student?: string;
  courseId?: string;
  course?: string;
  date: string;
  present: boolean;
  studentName?: string;
  rollNo?: string;
  courseName?: string;
  courseCode?: string;
}

const API = (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

// Convert ISO UTC timestamps (e.g. 2026-11-13T18:30:00.000Z) to local YYYY-MM-DD
const toLocalYMD = (raw: string): string => {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getTodayLocalYMD = (): string => toLocalYMD(new Date().toISOString());

const getYesterdayLocalYMD = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalYMD(d.toISOString());
};

const AttendancePage: React.FC = () => {
  const { user, token } = useAuth();
  const isStudent = user?.role === ROLES.STUDENT;

  const [tab, setTab] = useState<'mark' | 'history' | 'monthly'>(isStudent ? 'history' : 'mark');
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => getTodayLocalYMD(), []);
  const yesterdayStr = useMemo(() => getYesterdayLocalYMD(), []);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(todayStr);
  const [markMap, setMarkMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [filterMonth, setFilterMonth] = useState(todayStr.slice(0, 7));
  const [filterExactDate, setFilterExactDate] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Normalize backend fields so both old and new API responses work seamlessly
  const normalizeRecords = (rawList: AttendanceRecord[]): AttendanceRecord[] =>
    rawList.map((r) => ({
      ...r,
      studentId: String(r.studentId || r.student || ''),
      courseId: String(r.courseId || r.course || ''),
      date: toLocalYMD(r.date),
      present: Boolean(r.present),
    }));

  // Load courses, students, and attendance records
  const loadData = async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      if (isStudent) {
        const res = await fetch(`${API}/attendance/student/${user.id}`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        const data = await res.json();
        setRecords(Array.isArray(data) ? normalizeRecords(data) : []);
      } else {
        const [cRes, sRes, aRes] = await Promise.all([
          fetch(`${API}/courses`, { headers: { Authorization: 'Bearer ' + token } }),
          fetch(`${API}/students`, { headers: { Authorization: 'Bearer ' + token } }),
          fetch(`${API}/attendance`, { headers: { Authorization: 'Bearer ' + token } }),
        ]);
        const [cData, sData, aData] = await Promise.all([cRes.json(), sRes.json(), aRes.json()]);
        setCourses(Array.isArray(cData) ? cData : []);
        setStudents(Array.isArray(sData) ? sData : []);
        setRecords(Array.isArray(aData) ? normalizeRecords(aData) : []);
      }
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, user?.id]);

  // Filter students belonging to the selected course department
  const studentsForMarking = useMemo(() => {
    if (!selectedCourse) return [];
    const course = courses.find((c) => String(c.id) === String(selectedCourse));
    if (!course) return students;
    const deptMatches = students.filter((s) => s.department === course.department);
    return deptMatches.length > 0 ? deptMatches : students;
  }, [students, courses, selectedCourse]);

  // Pre-fill attendance state for the selected course and date
  useEffect(() => {
    if (!selectedCourse || !date) return;
    const nextMap: Record<string, boolean> = {};
    for (const st of studentsForMarking) {
      const existing = records.find(
        (r) =>
          String(r.studentId) === String(st.id) &&
          String(r.courseId) === String(selectedCourse) &&
          r.date === date
      );
      nextMap[st.id] = existing ? existing.present : true;
    }
    setMarkMap(nextMap);
  }, [selectedCourse, date, studentsForMarking, records]);

  // Save attendance records to the backend
  const handleSaveAttendance = async () => {
    if (!selectedCourse) {
      alert('Please select a course first.');
      return;
    }
    if (studentsForMarking.length === 0) {
      alert('No students found to mark attendance.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const payload = studentsForMarking.map((st) => ({
        studentId: st.id,
        courseId: selectedCourse,
        date,
        present: markMap[st.id] ?? true,
      }));
      const res = await fetch(`${API}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ records: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to save attendance.');
        return;
      }
      alert('Attendance saved successfully.');
      await loadData();
    } catch {
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered attendance history records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) =>
        filterExactDate ? r.date === filterExactDate : filterMonth ? r.date?.startsWith(filterMonth) : true
      )
      .filter((r) => (filterCourse ? String(r.courseId) === String(filterCourse) : true))
      .filter((r) =>
        searchTerm
          ? (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.rollNo || '').toLowerCase().includes(searchTerm.toLowerCase())
          : true
      );
  }, [records, filterMonth, filterExactDate, filterCourse, searchTerm]);

  // Student-wise monthly and overall attendance summary (deduplicated by student id / rollNo)
  const monthlySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        studentId: string;
        rollNo: string;
        name: string;
        monthTotal: number;
        monthPresent: number;
        overallTotal: number;
        overallPresent: number;
      }
    >();

    for (const s of students) {
      map.set(String(s.id), {
        studentId: String(s.id),
        rollNo: s.rollNo || '-',
        name: s.name || 'Student',
        monthTotal: 0,
        monthPresent: 0,
        overallTotal: 0,
        overallPresent: 0,
      });
    }

    for (const r of records) {
      const matchedStudent =
        students.find((s) => String(s.id) === String(r.studentId)) ||
        students.find((s) => r.rollNo && s.rollNo === r.rollNo);

      const key = matchedStudent ? String(matchedStudent.id) : String(r.studentId || r.rollNo || r.studentName);
      const cur = map.get(key) || {
        studentId: key,
        rollNo: r.rollNo || '-',
        name: r.studentName || 'Student',
        monthTotal: 0,
        monthPresent: 0,
        overallTotal: 0,
        overallPresent: 0,
      };
      cur.overallTotal += 1;
      if (r.present) cur.overallPresent += 1;
      if (!filterMonth || r.date?.startsWith(filterMonth)) {
        cur.monthTotal += 1;
        if (r.present) cur.monthPresent += 1;
      }
      map.set(key, cur);
    }

    return Array.from(map.values()).filter((row) =>
      searchTerm
        ? row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );
  }, [students, records, filterMonth, searchTerm]);

  // Personal attendance summary for student login
  const mySummary = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.present).length;
    const absent = total - present;
    const monthlyPct = total > 0 ? Math.round((present / total) * 100) : 0;

    const allTotal = records.length;
    const allPresent = records.filter((r) => r.present).length;
    const overallPct = allTotal > 0 ? Math.round((allPresent / allTotal) * 100) : 0;

    return { total, present, absent, monthlyPct, overallPct };
  }, [filteredRecords, records]);

  if (loading) {
    return <div className="p-6 text-slate-400">Loading attendance records...</div>;
  }

  // Student view
  if (isStudent) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Attendance</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterExactDate(filterExactDate === todayStr ? '' : todayStr)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                filterExactDate === todayStr
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setFilterExactDate(filterExactDate === yesterdayStr ? '' : yesterdayStr)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                filterExactDate === yesterdayStr
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
            >
              Yesterday
            </button>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => {
                setFilterExactDate('');
                setFilterMonth(e.target.value);
              }}
              className="px-3 py-2 rounded-xl bg-[#161920] border border-white/10 text-slate-200 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-[#12161c]/80 border border-white/10">
            <p className="text-xs uppercase text-slate-400">Total Days</p>
            <p className="text-2xl font-bold text-white mt-1">{mySummary.total}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#12161c]/80 border border-emerald-500/20">
            <p className="text-xs uppercase text-emerald-400">Present</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{mySummary.present}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#12161c]/80 border border-red-500/20">
            <p className="text-xs uppercase text-red-400">Absent</p>
            <p className="text-2xl font-bold text-red-300 mt-1">{mySummary.absent}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#12161c]/80 border border-amber-500/20">
            <p className="text-xs uppercase text-amber-400">Monthly %</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{mySummary.monthlyPct}%</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#12161c]/80 border border-blue-500/20">
            <p className="text-xs uppercase text-blue-400">Overall %</p>
            <p className="text-2xl font-bold text-blue-300 mt-1">{mySummary.overallPct}%</p>
          </div>
        </div>

        <div className="bg-[#12161c]/80 border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Course</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-slate-400">
                    No attendance records found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-6 py-3.5 text-white">{r.date}</td>
                    <td className="px-6 py-3.5">{r.courseName || r.courseId}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          r.present
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}
                      >
                        {r.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Admin and Teacher view
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
        </div>

        <div className="flex gap-2 bg-[#161920] p-1 rounded-xl border border-white/10">
          {[
            { id: 'mark', label: "Today's Attendance" },
            { id: 'history', label: 'History' },
            { id: 'monthly', label: 'Monthly %' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as 'mark' | 'history' | 'monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'mark' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-5">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-slate-200 text-sm"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseId} - {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-slate-200 text-sm"
            />
            {selectedCourse && studentsForMarking.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  studentsForMarking.forEach((s) => {
                    all[s.id] = true;
                  });
                  setMarkMap(all);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-sm border border-white/10"
              >
                Mark All Present
              </button>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#12161c]/80 border border-white/10 text-slate-300 text-sm">
              No courses found. Please add at least one course on the Courses page first.
            </div>
          ) : !selectedCourse ? (
            <div className="p-6 rounded-2xl bg-[#12161c]/80 border border-white/10 text-slate-400 text-sm">
              Select a course and date above to mark attendance.
            </div>
          ) : (
            <div className="bg-[#12161c]/80 border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3.5">Roll No</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsForMarking.map((st) => {
                    const isPresent = markMap[st.id] ?? true;
                    return (
                      <tr key={st.id} className="border-b border-white/5">
                        <td className="px-6 py-3.5 font-semibold text-amber-300">{st.rollNo}</td>
                        <td className="px-6 py-3.5 text-white">{st.name}</td>
                        <td className="px-6 py-3.5">{st.department}</td>
                        <td className="px-6 py-3.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMarkMap((p) => ({ ...p, [st.id]: true }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                              isPresent
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setMarkMap((p) => ({ ...p, [st.id]: false }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                              !isPresent
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-4 flex justify-end border-t border-white/10">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAttendance}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm"
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(tab === 'history' || tab === 'monthly') && (
        <div>
          <div className="flex flex-wrap gap-3 mb-5">
            {tab === 'history' && (
              <>
                <button
                  type="button"
                  onClick={() => setFilterExactDate(filterExactDate === todayStr ? '' : todayStr)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                    filterExactDate === todayStr
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-white/5 text-slate-300 border-white/10'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setFilterExactDate(filterExactDate === yesterdayStr ? '' : yesterdayStr)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                    filterExactDate === yesterdayStr
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-white/5 text-slate-300 border-white/10'
                  }`}
                >
                  Yesterday
                </button>
                <input
                  type="date"
                  value={filterExactDate}
                  onChange={(e) => setFilterExactDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-slate-200 text-sm"
                />
              </>
            )}
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => {
                setFilterExactDate('');
                setFilterMonth(e.target.value);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-slate-200 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setFilterMonth('');
                setFilterExactDate('');
              }}
              className="px-3 py-2.5 rounded-xl bg-white/5 text-slate-300 text-xs border border-white/10 hover:bg-white/10"
            >
              All Time
            </button>
            {tab === 'history' && (
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-slate-200 text-sm"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm"
            />
          </div>

          {tab === 'history' ? (
            <div className="bg-[#12161c]/80 border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Roll No</th>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Course</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="px-6 py-3.5 text-white">{r.date}</td>
                        <td className="px-6 py-3.5 font-semibold text-amber-300">{r.rollNo}</td>
                        <td className="px-6 py-3.5 text-white">{r.studentName}</td>
                        <td className="px-6 py-3.5">{r.courseName}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              r.present
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-red-500/15 text-red-300 border-red-500/30'
                            }`}
                          >
                            {r.present ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#12161c]/80 border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-white/5 text-amber-400/90 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3.5">Roll No</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Total Days</th>
                    <th className="px-5 py-3.5">Present</th>
                    <th className="px-5 py-3.5">Absent</th>
                    <th className="px-5 py-3.5">Monthly %</th>
                    <th className="px-5 py-3.5">Overall %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    monthlySummary.map((row) => {
                      const pct = row.monthTotal > 0 ? Math.round((row.monthPresent / row.monthTotal) * 100) : 0;
                      const overallPct =
                        row.overallTotal > 0 ? Math.round((row.overallPresent / row.overallTotal) * 100) : 0;
                      const pctClass =
                        pct >= 75
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : pct >= 50
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-red-500/15 text-red-300 border-red-500/30';
                      return (
                        <tr key={row.studentId} className="border-b border-white/5">
                          <td className="px-5 py-3.5 font-semibold text-amber-300">{row.rollNo}</td>
                          <td className="px-5 py-3.5 text-white font-medium">{row.name}</td>
                          <td className="px-5 py-3.5">{row.monthTotal}</td>
                          <td className="px-5 py-3.5 text-emerald-300">{row.monthPresent}</td>
                          <td className="px-5 py-3.5 text-red-300">{row.monthTotal - row.monthPresent}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${pctClass}`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-blue-300 font-semibold">{overallPct}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;