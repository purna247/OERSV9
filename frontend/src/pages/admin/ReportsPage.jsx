import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../services/api/adminApi';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { Users, BookOpen, ClipboardList, CreditCard, TrendingUp } from 'lucide-react';
import axiosInstance from '../../services/api/axiosInstance';

/* ── Stat card ─────────────────────────────────────────────── */
const StatItem = ({ icon: Icon, label, value, sub, alert = false }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-semibold mt-1 ${alert ? 'text-accent-red' : 'text-text-primary'}`}>{value}</p>
        {sub && <p className="text-xs text-text-tertiary mt-1">{sub}</p>}
      </div>
      <div className="w-9 h-9 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
    </div>
  </Card>
);

/* ── Pure SVG bar chart ────────────────────────────────────── */
function BarChart({ data, height = 160, color = '#121317' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor(100 / data.length);

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 24);
        const x = i * barW + barW * 0.15;
        const w = barW * 0.7;
        const y = height - 20 - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={barH} fill={color} opacity="0.85" rx="1" />
            <text x={x + w / 2} y={height - 6} textAnchor="middle" fontSize="5" fill="#6a6a71">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + w / 2} y={y - 2} textAnchor="middle" fontSize="5" fill={color} fontWeight="600">
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Donut chart ───────────────────────────────────────────── */
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (!total) return (
    <div style={{ width: size, height: size }} className="rounded-full border-4 border-border-default bg-bg-secondary flex items-center justify-center">
      <span className="text-xs text-text-tertiary">No data</span>
    </div>
  );

  const r = 40;
  const cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f3f9" strokeWidth="16" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity="0.9"
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#121317">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="#6a6a71">total</text>
    </svg>
  );
}

/* ── Horizontal bar ────────────────────────────────────────── */
function HBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="text-text-tertiary tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-slow" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export const ReportsPage = () => {
  const { data: summary, loading, error, execute: reload } = useFetch(adminApi.getDashboardSummary);
  const [events,       setEvents]       = useState([]);
  const [students,     setStudents]     = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/events').then(r => r.data),
      axiosInstance.get('/admin/students').then(r => r.data),
    ]).then(([evts, stus]) => {
      setEvents(Array.isArray(evts) ? evts : []);
      setStudents(Array.isArray(stus) ? stus : []);
    }).catch(() => {}).finally(() => setEventsLoading(false));
  }, []);

  if (loading || eventsLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-9 w-56" /><Skeleton className="h-4 w-72" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const stats = summary?.stats || {};
  const recentRegs = summary?.recentRegistrations || [];

  // ── Derived chart data ──────────────────────────────────────

  // 1. Registrations by event (bar chart)
  const regsByEvent = events.slice(0, 8).map(ev => ({
    label: `${ev.program_code}\nS${ev.semester}`,
    value: recentRegs.filter(r => r.event_name?.includes(ev.program_code)).length,
  }));

  // 2. Student status breakdown (donut)
  const activeCount   = students.filter(s => s.status === 'ACTIVE').length;
  const detainedCount = students.filter(s => s.status === 'DETAINED').length;
  const otherCount    = students.length - activeCount - detainedCount;
  const statusSegments = [
    { label: 'Active',   value: activeCount,   color: '#16a34a' },
    { label: 'Detained', value: detainedCount, color: '#dc2626' },
    { label: 'Other',    value: otherCount,    color: '#d1d5db' },
  ].filter(s => s.value > 0);

  // 3. Payment status from recent registrations
  const confirmed = recentRegs.filter(r => r.payment_status === 'CONFIRMED').length;
  const initiated = recentRegs.filter(r => r.payment_status === 'INITIATED').length;
  const failed    = recentRegs.filter(r => r.payment_status === 'FAILED').length;
  const payTotal  = confirmed + initiated + failed;

  // 4. Students per program (top 6)
  const programMap = {};
  students.forEach(s => { programMap[s.program_code] = (programMap[s.program_code] || 0) + 1; });
  const programData = Object.entries(programMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));
  const maxProg = Math.max(...programData.map(d => d.value), 1);

  // 5. Events by type
  const regularCount = events.filter(e => e.event_type === 'REGULAR').length;
  const arrearCount  = events.filter(e => e.event_type === 'ARREAR').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Reports &amp; Analytics</h2>
        <p className="text-sm text-text-secondary">System-wide summary and statistics</p>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-stagger">
        <StatItem icon={Users}        label="Total Students"       value={stats.totalStudents ?? 0}
          sub={`${activeCount} active · ${detainedCount} detained`} />
        <StatItem icon={BookOpen}     label="Total Events"         value={stats.totalEvents ?? 0}
          sub={`${regularCount} regular · ${arrearCount} arrear`} />
        <StatItem icon={ClipboardList} label="Confirmed Registrations" value={stats.activeRegistrations ?? 0} />
        <StatItem icon={CreditCard}   label="Pending Payments"    value={stats.pendingPayments ?? 0}
          alert={(stats.pendingPayments ?? 0) > 0} />
      </div>

      {/* Row 1: Student status donut + Payment breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Student status */}
        <Card header={<p className="text-sm font-medium text-text-primary">Student Status Distribution</p>}>
          <div className="flex items-center gap-8">
            <DonutChart segments={statusSegments} size={120} />
            <div className="space-y-3 flex-1">
              {statusSegments.map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-text-secondary">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary tabular-nums">{s.value}</span>
                    <span className="text-xs text-text-tertiary">
                      ({students.length > 0 ? Math.round(s.value / students.length * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Payment status */}
        <Card header={<p className="text-sm font-medium text-text-primary">Recent Registration Payments</p>}>
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <DonutChart
                segments={[
                  { label: 'Confirmed', value: confirmed, color: '#16a34a' },
                  { label: 'Pending',   value: initiated, color: '#d97706' },
                  { label: 'Failed',    value: failed,    color: '#dc2626' },
                ].filter(s => s.value > 0)}
                size={100}
              />
              <div className="space-y-2 flex-1">
                {[
                  { label: 'Confirmed', value: confirmed, color: '#16a34a', variant: 'success' },
                  { label: 'Pending',   value: initiated, color: '#d97706', variant: 'warning' },
                  { label: 'Failed',    value: failed,    color: '#dc2626', variant: 'error' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-sm text-text-secondary">{s.label}</span>
                    </div>
                    <Badge variant={s.variant}>{s.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-text-tertiary text-center">Based on last 10 registrations</p>
          </div>
        </Card>
      </div>

      {/* Row 2: Students per program + Events bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Students per program */}
        <Card header={<p className="text-sm font-medium text-text-primary">Students by Program</p>}>
          {programData.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-8">No student data</p>
          ) : (
            <div className="space-y-3">
              {programData.map(d => (
                <HBar key={d.label} label={d.label} value={d.value} max={maxProg} color="#121317" />
              ))}
            </div>
          )}
        </Card>

        {/* Events overview */}
        <Card header={<p className="text-sm font-medium text-text-primary">Exam Events Overview</p>}>
          {events.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-8">No events</p>
          ) : (
            <div className="space-y-4">
              <BarChart
                data={events.slice(0, 8).map(ev => ({
                  label: `S${ev.semester}`,
                  value: 1,
                }))}
                height={120}
                color="#121317"
              />
              <div className="divide-y divide-border-subtle">
                {events.slice(0, 5).map(ev => (
                  <div key={ev.event_id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{ev.program_code} · Sem {ev.semester}</p>
                      <p className="text-xs text-text-tertiary">{ev.academic_year}</p>
                    </div>
                    <Badge variant={ev.event_type === 'REGULAR' ? 'info' : 'warning'}>{ev.event_type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Recent registrations table */}
      {recentRegs.length > 0 && (
        <Card header={
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">Recent Registrations</p>
            <span className="text-xs text-text-tertiary">Last {recentRegs.length}</span>
          </div>
        }>
          <div className="divide-y divide-border-subtle">
            {recentRegs.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{r.student_name}</p>
                  <p className="text-xs text-text-tertiary font-mono mt-0.5">{r.reg_no} · {r.event_name}</p>
                </div>
                <Badge variant={
                  r.payment_status === 'CONFIRMED' ? 'success' :
                  r.payment_status === 'FAILED'    ? 'error'   : 'warning'
                }>{r.payment_status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
