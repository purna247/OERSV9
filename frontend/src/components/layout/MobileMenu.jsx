import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { X, LayoutDashboard, Users, Calendar, BarChart3, LogOut, FileText, Settings, BookOpen } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * MobileMenu Component
 * Full-screen slide-in navigation for mobile.
 * Requirements: 15.5, 15.6, 19.3, 19.4
 */

const NAV_LINKS = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard',       label: 'Dashboard',     icon: LayoutDashboard },
    { to: '/admin/programs',        label: 'Programs',      icon: BookOpen },
    { to: '/admin/students',        label: 'Students',      icon: Users },
    { to: '/admin/events',          label: 'Exam Events',   icon: Calendar },
    { to: '/admin/registrations',   label: 'Registrations', icon: FileText },
    { to: '/admin/reports',         label: 'Reports',       icon: BarChart3 },
    { to: '/admin/upload-students', label: 'Bulk Uploads',  icon: Settings },
  ],
  [ROLES.STUDENT]: [
    { to: '/student/dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
    { to: '/student/events',        label: 'Register Exam',    icon: FileText },
    { to: '/student/registrations', label: 'My Registrations', icon: BookOpen },
    { to: '/student/schedule',      label: 'Schedule',         icon: Calendar },
    { to: '/student/profile',       label: 'Profile',          icon: Users },
  ],
  [ROLES.ADVISOR]: [
    { to: '/advisor/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/advisor/attendance', label: 'Attendance',  icon: FileText },
    { to: '/advisor/students',   label: 'My Students', icon: Users },
  ],
};

export const MobileMenu = ({ isOpen, onClose }) => {
  const { role, logout } = useAuth();
  const links = NAV_LINKS[role] ?? [];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer — Requirement 15.5: slide-in from left */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-72 z-50 flex flex-col lg:hidden',
          'bg-bg-primary border-r border-border-default',
          'transform transition-transform duration-normal ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        {/* Header with close button */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border-default shrink-0">
          <span className="text-base font-semibold text-text-primary">OERS</span>
          {/* Close button — Requirement 15.6 */}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-sm text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors duration-normal"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav links — touch targets ≥ 44px — Requirement 19.4 */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 no-scrollbar">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 h-12 rounded-sm text-sm font-medium',
                'transition-colors duration-normal',
                isActive
                  ? 'bg-bg-secondary text-text-primary border-l-2 border-text-primary pl-[14px]'
                  : 'text-text-tertiary hover:bg-bg-secondary hover:text-text-primary border-l-2 border-transparent pl-[14px]',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border-default shrink-0">
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex w-full items-center gap-3 px-4 h-12 rounded-sm text-sm font-medium text-text-tertiary hover:bg-bg-secondary hover:text-text-primary transition-colors duration-normal"
          >
            <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
