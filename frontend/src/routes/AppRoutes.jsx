import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { ROLES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';

// Layout
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Admin
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UploadStudentsPage from '../pages/admin/UploadStudentsPage';
import StudentsPage from '../pages/admin/StudentsPage';
import ProgramsPage from '../pages/admin/ProgramsPage';
import ExamEventsPage from '../pages/admin/ExamEventsPage';
import RegistrationsPage from '../pages/admin/RegistrationsPage';
import ReportsPage from '../pages/admin/ReportsPage';

// Student
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import StudentEventsPage from '../pages/student/StudentEventsPage';
import StudentRegistrationsPage from '../pages/student/StudentRegistrationsPage';
import StudentSchedulePage from '../pages/student/StudentSchedulePage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import AdmitCardPage from '../pages/student/AdmitCardPage';

// Advisor
import AdvisorDashboardPage from '../pages/advisor/AdvisorDashboardPage';
import AdvisorAttendancePage from '../pages/advisor/AdvisorAttendancePage';
import AdvisorStudentsPage from '../pages/advisor/AdvisorStudentsPage';

// Design System Test (temporary for checkpoint verification)
import { DesignSystemTest } from '../pages/DesignSystemTest';

const Unauthorized = () => <div className="p-10 text-center">Unauthorized - <a href="/login" className="text-soft-purple">Go back</a></div>;
const NotFound = () => <div className="p-10 text-center">404 Not Found</div>;

const RootRedirect = () => {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === ROLES.ADMIN) return <Navigate to="/admin/dashboard" replace />;
  if (role === ROLES.STUDENT) return <Navigate to="/student/dashboard" replace />;
  if (role === ROLES.ADVISOR) return <Navigate to="/advisor/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Design System Test Route (temporary for checkpoint verification) */}
      <Route path="/design-system-test" element={<DesignSystemTest />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Admin Routes */}
          <Route path="/admin" element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="events" element={<ExamEventsPage />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="upload-students" element={<UploadStudentsPage />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="events" element={<StudentEventsPage />} />
            <Route path="registrations" element={<StudentRegistrationsPage />} />
            <Route path="schedule" element={<StudentSchedulePage />} />
            <Route path="profile" element={<StudentProfilePage />} />
          </Route>

          {/* Advisor Routes */}
          <Route path="/advisor" element={<RoleRoute allowedRoles={[ROLES.ADVISOR]} />}>
            <Route path="dashboard" element={<AdvisorDashboardPage />} />
            <Route path="attendance" element={<AdvisorAttendancePage />} />
            <Route path="students" element={<AdvisorStudentsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Admit Card — standalone full-page (no sidebar/layout) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/student/admit-card" element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
          <Route index element={<AdmitCardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
