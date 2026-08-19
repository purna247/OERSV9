import { useState, useEffect } from 'react';
import { studentApi } from '../../services/api/studentApi';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { Calendar } from 'lucide-react';

function formatTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

const columns = [
  {
    key: 'exam_date',
    label: 'Date',
    render: v => (
      <span className="text-sm font-medium text-text-primary">
        {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
      </span>
    ),
  },
  {
    key: 'session',
    label: 'Session',
    render: v => <span className="text-sm text-text-secondary capitalize">{v?.toLowerCase() || '—'}</span>,
  },
  {
    key: 'start_time',
    label: 'Timing',
    render: (v, row) => (
      <span className="font-mono text-sm text-text-secondary">
        {formatTime(v)} – {formatTime(row.end_time)}
      </span>
    ),
  },
  {
    key: 'subject_code',
    label: 'Code',
    render: v => <span className="font-mono text-sm font-medium text-text-primary">{v}</span>,
  },
  {
    key: 'subject_name',
    label: 'Subject',
    render: v => <span className="text-sm text-text-primary">{v}</span>,
  },
];

export const StudentSchedulePage = () => {
  const [registrations,   setRegistrations]   = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [schedule,        setSchedule]        = useState([]);
  const [loadingRegs,     setLoadingRegs]     = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [regsError,       setRegsError]       = useState(null);
  const [scheduleError,   setScheduleError]   = useState(null);

  // Load confirmed registrations on mount
  useEffect(() => {
    studentApi.getRegistrations()
      .then(data => {
        const confirmed = (data || []).filter(r => r.payment_status === 'CONFIRMED');
        setRegistrations(confirmed);
        if (confirmed.length === 1) setSelectedEventId(String(confirmed[0].event_id));
      })
      .catch(err => setRegsError(err.message || 'Failed to load registrations'))
      .finally(() => setLoadingRegs(false));
  }, []);

  // Fetch schedule when event selection changes
  useEffect(() => {
    if (!selectedEventId) { setSchedule([]); return; }
    setLoadingSchedule(true);
    setScheduleError(null);
    studentApi.getSchedule(Number(selectedEventId))
      .then(data => setSchedule(data || []))
      .catch(err => setScheduleError(err.message || 'Failed to load schedule'))
      .finally(() => setLoadingSchedule(false));
  }, [selectedEventId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Exam Schedule</h2>
        <p className="text-sm text-text-secondary">Timetable for your registered examinations</p>
      </section>

      {/* Registration error */}
      {regsError && <ErrorState message={regsError} onRetry={() => window.location.reload()} />}

      {/* Loading registrations */}
      {loadingRegs && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
        </div>
      )}

      {/* No confirmed registrations */}
      {!loadingRegs && !regsError && registrations.length === 0 && (
        <Card>
          <div className="text-center py-12 space-y-2">
            <Calendar className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No confirmed registrations</p>
            <p className="text-xs text-text-tertiary max-w-xs mx-auto">
              Register for an exam and complete payment to view your schedule.
            </p>
          </div>
        </Card>
      )}

      {/* Event selector — only shown when multiple confirmed registrations */}
      {!loadingRegs && !regsError && registrations.length > 1 && (
        <div className="max-w-sm">
          <Select
            label="Exam Event"
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            <option value="">— Choose an event —</option>
            {registrations.map(r => (
              <option key={r.event_id} value={r.event_id}>
                {r.program_code} · Sem {r.semester} · {r.event_type} · {r.academic_year}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Schedule content */}
      {selectedEventId && (
        scheduleError ? (
          <ErrorState message={scheduleError} onRetry={() => {
            const id = selectedEventId;
            setSelectedEventId('');
            setTimeout(() => setSelectedEventId(id), 50);
          }} />
        ) : loadingSchedule ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : schedule.length === 0 ? (
          <Card>
            <div className="text-center py-12 space-y-2">
              <Calendar className="w-8 h-8 text-text-tertiary mx-auto" />
              <p className="text-sm font-medium text-text-primary">No schedule published yet</p>
              <p className="text-xs text-text-tertiary">The timetable for this event hasn't been released. Check back later.</p>
            </div>
          </Card>
        ) : (
          <Card padding="sm">
            <Table columns={columns} data={schedule} hoverable />
          </Card>
        )
      )}
    </div>
  );
};

export default StudentSchedulePage;
