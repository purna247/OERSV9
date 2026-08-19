import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api/adminApi';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { FileText } from 'lucide-react';

const paymentVariant = (s) => {
  if (!s) return 'neutral';
  const u = s.toUpperCase();
  if (u === 'CONFIRMED' || u === 'PAID') return 'success';
  if (u === 'PENDING')  return 'warning';
  if (u === 'FAILED')   return 'error';
  return 'neutral';
};

const regVariant = (s) => {
  if (!s) return 'neutral';
  const u = s.toUpperCase();
  if (u === 'CONFIRMED') return 'success';
  if (u === 'PENDING')   return 'warning';
  if (u === 'CANCELLED') return 'error';
  return 'neutral';
};

export const RegistrationsPage = () => {
  const [events,          setEvents]          = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations,   setRegistrations]   = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [eventsLoading,   setEventsLoading]   = useState(true);
  const [error,           setError]           = useState(null);

  useEffect(() => {
    adminApi.getEvents()
      .then(rows => setEvents(Array.isArray(rows) ? rows : []))
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEventId) { setRegistrations([]); setError(null); return; }
    setLoading(true); setError(null);
    adminApi.getRegistrations(selectedEventId)
      .then(data => setRegistrations(Array.isArray(data) ? data : (data?.registrations || [])))
      .catch(err => { setError(err.message || 'Failed to load registrations.'); setRegistrations([]); })
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const columns = [
    {
      key: 'reg_no',
      label: 'Reg No',
      render: v => <span className="font-mono text-sm text-text-secondary">{v}</span>,
    },
    { key: 'name', label: 'Student' },
    {
      key: 'fee_paid',
      label: 'Fee Paid',
      render: v => <span className="text-sm font-medium text-text-primary">₹{v || 0}</span>,
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: v => <Badge variant={paymentVariant(v)}>{v || '—'}</Badge>,
    },
    {
      key: 'registration_status',
      label: 'Registration',
      render: v => <Badge variant={regVariant(v)}>{v || '—'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">All Registrations</h2>
        <p className="text-sm text-text-secondary">View student exam registrations by event</p>
      </section>

      {/* Event selector */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-sm">
            <Select
              label="Exam Event"
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              disabled={eventsLoading}
            >
              <option value="">{eventsLoading ? 'Loading events…' : '— Pick an exam event —'}</option>
              {events.map(ev => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.program_code} · Sem {ev.semester} · {ev.event_type} · {ev.academic_year}
                </option>
              ))}
            </Select>
          </div>
          {selectedEventId && (
            <Badge variant="info">Event #{selectedEventId}</Badge>
          )}
        </div>
      </Card>

      {/* Results */}
      {!selectedEventId ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <FileText className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">Select an event above</p>
            <p className="text-xs text-text-tertiary">Choose an exam event to view its registrations.</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <p className="text-sm text-accent-red text-center py-8">{error}</p>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !registrations.length ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <FileText className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No registrations found</p>
            <p className="text-xs text-text-tertiary">No students have registered for this event yet.</p>
          </div>
        </Card>
      ) : (
        <Card padding="sm">
          <Table columns={columns} data={registrations} sortable hoverable pagination={{ pageSize: 20 }} />
        </Card>
      )}
    </div>
  );
};

export default RegistrationsPage;
