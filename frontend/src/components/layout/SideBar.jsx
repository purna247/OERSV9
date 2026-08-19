import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import {
  LayoutDashboard, Users, Calendar, BarChart3,
  LogOut, FileText, Settings, BookOpen,
} from 'lucide-react';
import { cn } from '../../utils/cn';

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

const ROLE_LABEL = {
  [ROLES.ADMIN]:   'Administrator',
  [ROLES.STUDENT]: 'Student',
  [ROLES.ADVISOR]: 'Advisor',
};

export const SideBar = ({ isOpen, closeMenu }) => {
  const { role, logout } = useAuth();
  const links = NAV_LINKS[role] ?? [];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-50 flex flex-col',
          'bg-bg-primary border-r border-border-default',
          'transform transition-transform duration-normal ease-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        {/* Top spacer — aligns nav start with topbar height */}
        <div className="h-16 shrink-0 border-b border-border-default" />

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 no-scrollbar">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 h-10 rounded-sm text-sm font-medium cursor-pointer',
                'transition-colors duration-normal',
                isActive
                  ? 'bg-bg-secondary text-text-primary'
                  : 'text-text-tertiary hover:bg-bg-secondary hover:text-text-primary',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: role badge + logout */}
        <div className="p-3 border-t border-border-default shrink-0 space-y-1">
          {/* Role indicator */}
          <div className="px-3 py-2 rounded-sm bg-bg-secondary flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-text-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-bg-primary uppercase">
                {(role || 'U')[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{ROLE_LABEL[role] ?? role}</p>
              <p className="text-[10px] text-text-tertiary">OERS Portal</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-3 px-3 h-10 rounded-sm text-sm font-medium cursor-pointer',
              'text-text-tertiary hover:bg-bg-secondary hover:text-text-primary',
              'transition-colors duration-normal',
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideBar;
