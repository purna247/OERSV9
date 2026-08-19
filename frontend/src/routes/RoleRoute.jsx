import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RoleRoute = ({ allowedRoles }) => {
  const { role, loading } = useAuth();

  // Still initialising — don't redirect yet
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg-secondary text-text-tertiary text-sm">Loading…</div>;
  }

  // Role loaded but not in allowed list
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
