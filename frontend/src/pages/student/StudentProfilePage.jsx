import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { User, Mail, BookOpen, GraduationCap, Hash, AlertTriangle } from 'lucide-react';
import axiosInstance from '../../services/api/axiosInstance';
import { studentApi } from '../../services/api/studentApi';
import { cn } from '../../utils/cn';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function resolvePhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const statusVariant = (s) => {
  if (!s) return 'neutral';
  const u = s.toUpperCase();
  if (u === 'ACTIVE')   return 'success';
  if (u === 'DETAINED') return 'error';
  return 'neutral';
};

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
    <div className="w-8 h-8 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-text-tertiary" />
    </div>
    <div>
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
      <p className="text-sm mt-0.5 text-text-primary font-medium">{value ?? '—'}</p>
    </div>
  </div>
);

// Attendance bar for a single subject
const AttendanceRow = ({ subject_code, subject_name, attendance_percentage, minimum_attendance }) => {
  const pct     = Math.min(100, Math.max(0, attendance_percentage));
  const passing = pct >= minimum_attendance;

  return (
    <div className="py-3 border-b border-border-subtle last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="min-w-0 mr-3">
          <span className="font-mono text-xs text-text-secondary">{subject_code}</span>
          <span className="text-xs text-text-tertiary ml-2 truncate hidden sm:inline">{subject_name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!passing && <AlertTriangle className="w-3.5 h-3.5 text-[#854d0e]" />}
          <span className={cn(
            'text-xs font-semibold tabular-nums',
            passing ? 'text-[#166534]' : 'text-[#991b1b]'
          )}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-slow', passing ? 'bg-[#16a34a]' : 'bg-[#dc2626]')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Minimum line marker */}
      <div className="relative h-0" style={{ marginTop: '-6px' }}>
        <div
          className="absolute top-0 w-px h-3 bg-text-tertiary opacity-40"
          style={{ left: `${minimum_attendance}%` }}
          title={`Minimum: ${minimum_attendance}%`}
        />
      </div>
    </div>
  );
};

export const StudentProfilePage = () => {
  const [profile,    setProfile]    = React.useState(null);
  const [attendance, setAttendance] = React.useState([]);
  const [loading,    setLoading]    = React.useState(true);
  const [error,      setError]      = React.useState(null);

  React.useEffect(() => {
    Promise.all([
      axiosInstance.get('/student/profile'),
      studentApi.getAttendance().catch(() => ({ attendance: [] })),
    ]).then(([profileRes, attendanceRes]) => {
      setProfile(profileRes.data);
      setAttendance(attendanceRes.attendance || []);
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load profile');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  // Flatten profile data (backend wraps in { profile: {...} })
  const p = profile?.profile ?? profile;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">My Profile</h2>
        <p className="text-sm text-text-secondary">Your academic and personal information</p>
      </section>

      {/* Identity card */}
      <Card>
        <div className="flex items-center gap-4 pb-4 mb-2 border-b border-border-default">
          {/* Avatar — show photo if available, fallback to icon */}
          <div className="w-14 h-14 rounded-sm overflow-hidden border border-border-default bg-bg-secondary shrink-0 flex items-center justify-center">
            {resolvePhotoUrl(p?.photo_url) ? (
              <img
                src={resolvePhotoUrl(p?.photo_url)}
                alt={p?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-text-tertiary" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{p?.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-text-secondary">{p?.reg_no}</span>
              <Badge variant={statusVariant(p?.status)}>{p?.status || 'ACTIVE'}</Badge>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border-subtle">
          <Field icon={Mail}          label="Email"          value={p?.email} />
          <Field icon={BookOpen}      label="Program"        value={p?.program_code} />
          <Field icon={GraduationCap} label="Semester"       value={p?.semester} />
          <Field icon={GraduationCap} label="Admission Year" value={p?.admission_year} />
          <Field icon={Hash}          label="CGPA"           value={p?.cgpa} />
        </div>
      </Card>

      {/* Attendance section */}
      {attendance.length > 0 && (
        <div className="space-y-4 animate-fade-in-stagger">
          <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide">Attendance</h3>

          {attendance.map(event => {
            const detained = event.subjects.some(s => s.attendance_percentage < event.minimum_attendance);
            return (
              <Card key={event.event_id}>
                {/* Event header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {event.event_type} — {event.academic_year}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {event.program_code} · Semester {event.semester} · Min {event.minimum_attendance}%
                    </p>
                  </div>
                  {detained && (
                    <Badge variant="error" className="shrink-0">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Detention Risk
                    </Badge>
                  )}
                </div>

                {/* Subject rows */}
                <div>
                  {event.subjects.map(s => (
                    <AttendanceRow
                      key={s.subject_code}
                      {...s}
                      minimum_attendance={event.minimum_attendance}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* No attendance yet */}
      {attendance.length === 0 && (
        <Card>
          <div className="text-center py-8 space-y-1">
            <p className="text-sm font-medium text-text-primary">No attendance records yet</p>
            <p className="text-xs text-text-tertiary">Attendance will appear here once uploaded by your advisor.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentProfilePage;
