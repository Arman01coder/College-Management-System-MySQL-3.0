import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  PresentationChartLineIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { ROLES } from '../constants';

interface Stats {
  students: number;
  teachers: number;
  courses: number;
  attendance: number;
}

interface MyStudentProfile {
  id: string;
  rollNo: string;
  name: string;
  father_name?: string;
  mother_name?: string;
  department: string;
  semester?: string;
  phone?: string;
  email?: string;
  contact?: string;
}

const API_BASE = 'http://localhost:5000/api';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: number; color: string }> = ({
  icon,
  title,
  value,
  color,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</p>
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const isStudent = user?.role === ROLES.STUDENT;

  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<MyStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token) return;
      setLoading(true);
      try {
        if (isStudent) {
          const res = await fetch(`${API_BASE}/students/me`, {
            headers: { Authorization: 'Bearer ' + token },
          });
          if (res.ok) {
            setProfile(await res.json());
          }
        } else {
          const [studentData, teacherData, courseData, attendanceData] = await Promise.all([
            apiService.getStudents(token),
            user?.role === ROLES.ADMIN ? apiService.getTeachers(token) : Promise.resolve([]),
            apiService.getCourses(token),
            apiService.getAttendance(token),
          ]);
          setStats({
            students: studentData.length,
            teachers: teacherData.length,
            courses: courseData.length,
            attendance: attendanceData.length,
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [token, isStudent, user?.role]);

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>;
  }

  // Clean read-only Student Profile view on Dashboard
  if (isStudent) {
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Welcome back, {user?.name}!
        </h1>

        {!profile ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-gray-600 dark:text-gray-300">
            Your student profile is not linked yet. Please contact your teacher or admin.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
            <div className="flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700 pb-4">
              <UserCircleIcon className="h-11 w-11 text-primary-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">My Profile</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Student Information (Go to Settings to update contact or password)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{profile.name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Roll Number</p>
                <p className="font-semibold text-amber-500 mt-0.5">{profile.rollNo}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Course / Department</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{profile.department}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Semester</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{profile.semester || 'Sem 1'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Father&apos;s Name</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{profile.father_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Mother&apos;s Name</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{profile.mother_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Mobile Number</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{profile.phone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Email Address</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                  {profile.email || profile.contact || '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Welcome back, {user?.name}!
      </h1>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<UserGroupIcon className="h-8 w-8 text-white" />}
            title="Total Students"
            value={stats.students}
            color="bg-blue-500"
          />
          {user?.role === ROLES.ADMIN && (
            <StatCard
              icon={<AcademicCapIcon className="h-8 w-8 text-white" />}
              title="Total Teachers"
              value={stats.teachers}
              color="bg-green-500"
            />
          )}
          <StatCard
            icon={<BookOpenIcon className="h-8 w-8 text-white" />}
            title="Total Courses"
            value={stats.courses}
            color="bg-purple-500"
          />
          <StatCard
            icon={<PresentationChartLineIcon className="h-8 w-8 text-white" />}
            title="Attendance Records"
            value={stats.attendance}
            color="bg-yellow-500"
          />
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Could not load dashboard statistics.</p>
      )}
    </div>
  );
};

export default DashboardPage;