import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const LAMP_THEME_CSS = [
  '.lamp-theme-shell aside, .lamp-theme-shell header {',
  '  background-color: rgba(18, 22, 28, 0.78) !important;',
  '  backdrop-filter: blur(22px);',
  '  border-color: rgba(255, 255, 255, 0.08) !important;',
  '  color: #f0f3f8 !important;',
  '}',
  '.lamp-theme-shell aside a.bg-primary-600 {',
  '  background: linear-gradient(135deg, #ffab3d 0%, #d48b28 100%) !important;',
  '  color: #0b0d10 !important;',
  '  font-weight: 700;',
  '  box-shadow: 0 8px 20px -4px rgba(255, 171, 61, 0.35);',
  '}',
  '.lamp-theme-shell main .bg-white, .lamp-theme-shell main .dark\\:bg-gray-800 {',
  '  background-color: rgba(18, 22, 28, 0.75) !important;',
  '  backdrop-filter: blur(20px);',
  '  border: 1px solid rgba(255, 255, 255, 0.08);',
  '  color: #f0f3f8 !important;',
  '}',
  '.lamp-theme-shell main .text-gray-800, .lamp-theme-shell main .text-gray-900, .lamp-theme-shell main .text-gray-700 {',
  '  color: #f0f3f8 !important;',
  '}',
  '.lamp-theme-shell main .text-gray-500, .lamp-theme-shell main .text-gray-600 {',
  '  color: #8b95a5 !important;',
  '}',
  '.lamp-theme-shell main .bg-primary-600 {',
  '  background: linear-gradient(135deg, #ffab3d 0%, #d48b28 100%) !important;',
  '  color: #0b0d10 !important;',
  '  font-weight: 600;',
  '}'
].join('\n');

const DashboardLayout: React.FC = () => {
  return (
    <div className="lamp-theme-shell flex h-screen bg-[#0c0e12] text-[#f0f3f8] relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 22% 18%, rgba(255, 171, 61, 0.14), transparent 55%), radial-gradient(circle at 82% 80%, rgba(255, 171, 61, 0.08), transparent 50%)',
        }}
      />
      <style>{LAMP_THEME_CSS}</style>
      <div className="relative z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;