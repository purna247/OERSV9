import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Input';
import { ErrorState } from '../../components/common/ErrorState';
import { Users, Mail, Hash, AlertTriangle, Search } from 'lucide-react';
import axiosInstance from '../../services/api/axiosInstance';
import { cn } from '../../utils/cn';

const statusVariant = (s) => {
  if (!s) return 'neutral';
  const u = s.toUpperCase();
  if (u === 'ACTIVE')   return 'success';
  if (u === 'DETAINED') return 'error';
  return 'neutral';
};

// Mini attendance bar
const AttBar = ({ pct, min = 75 }) => {
  const p = Math.min(100, Math.max(0, pct));
  const ok = p >= min;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: ok ? '#16a34a' : '#dc2626' }} />
      </div>
      <span className={cn('text-xs font-medium tabular-nums shrink-0', ok ? 'text-[#166534]' : 'text-[#991b1b]')}>
        {p.toFixed(0)}%
      </span>
      {!ok && <AlertTriangle className="w-3 h-3 text-[#854d0e] shrink-0" />}
    </div>
  );
};

// Student card — mobile-first
const StudentCard = ({ student }) => {
  const att = student.latest_attendance;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-border-subtle last:border-0">
      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-primary">{student.name}</span>
          <Badge variant={statusVariant(student.status)} size="sm">{student.status || 'ACTIVE'}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          <span className="font-mono text-xs text-text-secondary">{student.reg_no}</span>
          {student.email && (
            <span className="text-xs text-text-tertiary truncate max-w-[200px]">{student.email}</span>
          )}
          {student.cgpa && (
            <span className="text-xs text-text-tertiary">CGPA: <strong className="text-text-secondary">{student.cgpa}</strong></span>
          )}
        </div>
      </div>

      {/* Attendance */}
      <div className="sm:w-40 shrink-0">
        {att ? (
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wide">
              {att.academic_year} · {att.event_type}
            </p>
            <AttBar pct={Number(att.attendance_percentage)} />
          </div>
        ) : (
          <span className="text-xs text-text-tertiary italic">No attendance</span>
        )}
      </div>
    </div>
  );
};

export const AdvisorStudentsPage = () => {
  const [students, setStudents] = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState(null);
  const [search,   setSearch]   = useState('');

  React.useEffect(() => {
    axiosInstance.get('/advisor/students')
      .then(res => { setStudents(res.data ?? []); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load students'); setLoading(false); });
  }, []);

  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.reg_no?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">My Students</h2>
        <p className="text-sm text-text-secondary">Students assigned to your advisory</p>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : students.length === 0 ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <Users className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No students assigned</p>
            <p className="text-xs text-text-tertiary">Contact admin to assign students to your advisor account.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Search + count */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, reg no or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-sm bg-bg-primary text-text-primary border border-border-default rounded-sm focus:outline-none focus:border-text-secondary transition-colors duration-normal placeholder:text-text-tertiary"
              />
            </div>
            <span className="text-xs text-text-tertiary shrink-0">
              {filtered.length} of {students.length} students
            </span>
          </div>

          <Card padding="sm">
            {/* Column headers — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-3 px-1 pb-2 border-b border-border-default">
              <div className="flex-1">
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Student</span>
              </div>
              <div className="w-40 shrink-0">
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Attendance</span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-tertiary">No students match your search.</p>
              </div>
            ) : (
              <div>
                {filtered.map(s => <StudentCard key={s.student_id} student={s} />)}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default AdvisorStudentsPage;
