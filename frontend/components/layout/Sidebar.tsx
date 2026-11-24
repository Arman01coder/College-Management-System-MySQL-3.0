import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChartPieIcon, UserGroupIcon, AcademicCapIcon, BookOpenIcon, PresentationChartLineIcon, BuildingLibraryIcon, BanknotesIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  
  const navLinkClasses = "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors";
  const activeClasses = "bg-primary-500 text-white";
  const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-gray-700";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${navLinkClasses} ${isActive ? activeClasses : inactiveClasses}`;

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-700">
         <div className="flex items-center space-x-2">
            <BuildingLibraryIcon className="h-8 w-8 text-primary-600" />
            <span className="text-lg font-bold text-gray-800 dark:text-white">CMS Portal</span>
          </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/dashboard" className={getNavLinkClass}>
          <ChartPieIcon className="h-5 w-5 mr-3" />
          Dashboard
        </NavLink>
        {(user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER) && (
          <NavLink to="/students" className={getNavLinkClass}>
            <UserGroupIcon className="h-5 w-5 mr-3" />
            Students
          </NavLink>
        )}
        {user?.role === ROLES.ADMIN && (
          <NavLink to="/teachers" className={getNavLinkClass}>
            <AcademicCapIcon className="h-5 w-5 mr-3" />
            Teachers
          </NavLink>
        )}
        {(user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER) && (
          <NavLink to="/courses" className={getNavLinkClass}>
            <BookOpenIcon className="h-5 w-5 mr-3" />
            Courses
          </NavLink>
        )}
        <NavLink to="/attendance" className={getNavLinkClass}>
          <PresentationChartLineIcon className="h-5 w-5 mr-3" />
          Attendance
        </NavLink>
        <NavLink to="/fees" className={getNavLinkClass}>
          <BanknotesIcon className="h-5 w-5 mr-3" />
          Fees
        </NavLink>
        <NavLink to="/settings" className={getNavLinkClass}>
          <Cog6ToothIcon className="h-5 w-5 mr-3" />
          Settings
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;