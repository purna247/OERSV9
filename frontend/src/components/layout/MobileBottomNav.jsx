import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { LayoutDashboard, Users, Calendar, BarChart3, BookOpen, Settings, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';

const MOBILE_LINKS = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard',       icon: LayoutDashboard },
    { to: '/admin/students',        icon: Users },
    { to: '/admin/events',          icon: Calendar },
    { to: '/admin/reports',         icon: BarChart3 },
    { to: '/admin/upload-students', icon: Settings },
  ],
  [ROLES.STUDENT]: [
    { to: '/student/dashboard',     icon: LayoutDashboard },
    { to: '/student/events',        icon: Calendar },
    { to: '/student/registrations', icon: BookOpen },
    { to: '/student/profile',       icon: Users },
  ],
  [ROLES.ADVISOR]: [
    { to: '/advisor/dashboard',  icon: LayoutDashboard },
    { to: '/advisor/attendance', icon: FileText },
    { to: '/advisor/students',   icon: Users },
  ],
};

export const MobileBottomNav = () => {
  const { role } = useAuth();
  const links = (MOBILE_LINKS[role] ?? []).slice(0, 5);

  if (!links.length) return null;

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'h-16 flex items-center justify-around px-2',
        'bg-bg-primary border-t border-border-default',
      )}
      aria-label="Mobile navigation"
    >
      {links.map(({ to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            'flex flex-col items-center justify-center w-12 h-12 rounded-sm',
            'transition-colors duration-normal',
            isActive
              ? 'text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          {({ isActive }) => (
            <Icon
              className="w-5 h-5"
              strokeWidth={isActive ? 2 : 1.5}
            />
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
