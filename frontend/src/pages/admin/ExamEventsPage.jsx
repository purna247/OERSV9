import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusChip } from '../../components/common/StatusChip';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import { useFetch } from '../../hooks/useFetch';
import { cn } from '../../utils/cn';
import {
  PlusCircle, CalendarDays, ChevronRight,
  AlertCircle, Loader2, CheckCircle2,
} from 'lucide-react';
import axiosInstance from '../../services/api/axiosInstance';
import { normalizeError } from '../../utils/errorHandler';

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchEvents   = () => axiosInstance.get('/admin/events').then(r => r.data);
const fetchPrograms = () => axiosInstance.get('/admin/programs').then(r => r.data);

// ─── Shared minimal input / select styles ─────────────────────────────────────
const inputCls = [
  'w-full h-10 px-3 text-sm',
  'bg-bg-primary text-text-primary',
  'border border-border-default rounded-sm',
  'focus:outline-none focus:border-text-secondary',
  'transition-colors duration-normal',
  'placeholder:text-text-tertiary',
].join(' ');

const labelCls = 'block text-xs font-medium text-text-secondary mb-1.5';

// ─── Toggle chip (programs / semesters) ──────────────────────────────────────
const ToggleChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors duration-normal',
      active
        ? 'bg-text-primary text-bg-primary border-text-primary'
        : 'bg-bg-primary text-text-secondary border-border-default hover:border-text-secondary'
    )}
  >
    {children}
  </button>
);

// ─── Create Event Modal ───────────────────────────────────────────────────────
const INITIAL_FORM = {
  programs: [], semesters: [], event_type: 'REGULAR', academic_year: '',
  registration_start: '', registration_end: '', late_fee_end: '',
  exam_start: '', exam_end: '',
  base_fee: '1500', late_fee: '500', minimum_cgpa: '6.0', minimum_attendance: '75',
};
const ALL_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function CreateEventModal({ programs, onClose, onSuccess }) {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const toggleMulti = (key, value) =>
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(x => x !== value)
        : [...prev[key], value],
    }));

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post('/admin/events/bulk', {
        ...form,
        semesters:           form.semesters.map(Number),
        base_fee:            Number(form.base_fee),
        late_fee:            Number(form.late_fee),
        minimum_cgpa:        Number(form.minimum_cgpa),
        minimum_attendance:  Number(form.minimum_attendance),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = form.programs.length > 0 && form.semesters.length > 0 && !loading;

  const footer = (
    <div className="flex gap-3 justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-10 px-5 text-sm font-medium text-text-secondary border border-border-default rounded-sm hover:bg-bg-secondary transition-colors duration-normal"
      >
        Cancel
      </button>
      <button
        form="create-event-form"
        type="submit"
        disabled={!canSubmit}
        className="h-10 px-5 text-sm font-medium text-bg-primary bg-text-primary rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-normal flex items-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading
          ? 'Creating…'
          : `Create (${form.programs.length} × ${form.semesters.length})`}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create Exam Event"
      size="lg"
      footer={footer}
    >
      <form id="create-event-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Programs */}
        <div>
          <label className={labelCls}>Programs <span className="text-accent-red">*</span></label>
          <div className="flex flex-wrap gap-2 mt-1">
            {programs.map(p => (
              <ToggleChip
                key={p.program_code}
                active={form.programs.includes(p.program_code)}
                onClick={() => toggleMulti('programs', p.program_code)}
              >
                {p.program_code}
              </ToggleChip>
            ))}
          </div>
        </div>

        {/* Semesters */}
        <div>
          <label className={labelCls}>Semesters <span className="text-accent-red">*</span></label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_SEMESTERS.map(s => (
              <ToggleChip
                key={s}
                active={form.semesters.includes(s)}
                onClick={() => toggleMulti('semesters', s)}
              >
                {s}
              </ToggleChip>
            ))}
          </div>
        </div>

        {/* Event Type + Academic Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Event Type <span className="text-accent-red">*</span></label>
            <select name="event_type" value={form.event_type} onChange={handleChange} className={inputCls}>
              <option value="REGULAR">REGULAR</option>
              <option value="ARREAR">ARREAR</option>
              <option value="SUPPLEMENTARY">SUPPLEMENTARY</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Academic Year <span className="text-accent-red">*</span></label>
            <input
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              placeholder="e.g. 2024-2025"
              className={inputCls}
            />
          </div>
        </div>

        {/* Date fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['registration_start', 'Registration Opens'],
            ['registration_end',   'Registration Closes'],
            ['late_fee_end',       'Late Fee Deadline'],
            ['exam_start',         'Exam Starts'],
            ['exam_end',           'Exam Ends'],
          ].map(([name, label]) => (
            <div key={name}>
              <label className={labelCls}>{label} <span className="text-accent-red">*</span></label>
              <input type="date" name={name} value={form[name]} onChange={handleChange} className={inputCls} />
            </div>
          ))}
        </div>

        {/* Numeric fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['base_fee',            'Base Fee (₹)'],
            ['late_fee',            'Late Fee (₹)'],
            ['minimum_cgpa',        'Min CGPA'],
            ['minimum_attendance',  'Min Attendance (%)'],
          ].map(([name, label]) => (
            <div key={name}>
              <label className={labelCls}>{label}</label>
              <input
                type="number"
                name={name}
                value={form[name]}
                onChange={handleChange}
                step="any"
                className={inputCls}
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-accent-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── Schedule Manager Modal ───────────────────────────────────────────────────
const SESSION_OPTIONS = ['MORNING', 'AFTERNOON', 'EVENING'];

const scheduleInputCls = [
  'h-9 px-3 text-xs',
  'bg-bg-primary text-text-primary',
  'border border-border-default rounded-sm',
  'focus:outline-none focus:border-text-secondary',
  'transition-colors duration-normal',
].join(' ');

function ScheduleModal({ event, onClose, onPublished }) {
  const [subjects,     setSubjects]     = useState([]);
  const [loadingInit,  setLoadingInit]  = useState(true);
  const [saving,       setSaving]       = useState({});
  const [publishing,   setPublishing]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [rows,         setRows]         = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  React.useEffect(() => {
    async function load() {
      try {
        const [schedRes, subjRes] = await Promise.all([
          axiosInstance.get(`/admin/schedule?event_id=${event.event_id}`),
          axiosInstance.get(`/admin/subjects?program_code=${event.program_code}&semester=${event.semester}&type=THEORY`),
        ]);
        const schedRows  = schedRes.data || [];
        const allSubjects = subjRes.data || [];
        setSubjects(allSubjects);
        const initial = {};
        allSubjects.forEach(s => {
          const existing = schedRows.find(r => r.subject_id === s.subject_id);
          initial[s.subject_id] = existing
            ? { schedule_id: existing.schedule_id, exam_date: existing.exam_date, start_time: existing.start_time, end_time: existing.end_time, session: existing.session }
            : { schedule_id: null, exam_date: '', start_time: '09:30', end_time: '12:30', session: 'MORNING' };
        });
        setRows(initial);
      } catch (e) {
        showToast(normalizeError(e).message, 'error');
      } finally {
        setLoadingInit(false);
      }
    }
    load();
  }, [event.event_id, event.program_code, event.semester]);

  const updateRow = (subjectId, field, value) =>
    setRows(prev => ({ ...prev, [subjectId]: { ...prev[subjectId], [field]: value } }));

  const handleSaveRow = async (subjectId) => {
    const row = rows[subjectId];
    if (!row.exam_date || !row.start_time || !row.end_time || !row.session) {
      showToast('Fill all fields before saving', 'error');
      return;
    }
    setSaving(prev => ({ ...prev, [subjectId]: true }));
    try {
      if (row.schedule_id) {
        await axiosInstance.put(`/admin/schedule/${row.schedule_id}`, {
          exam_date: row.exam_date, start_time: row.start_time,
          end_time: row.end_time, session: row.session, is_honors: false,
        });
        showToast('Updated');
      } else {
        const res = await axiosInstance.post('/admin/schedule', {
          event_id: event.event_id, subject_id: subjectId,
          exam_date: row.exam_date, start_time: row.start_time,
          end_time: row.end_time, session: row.session, is_honors: false,
        });
        setRows(prev => ({ ...prev, [subjectId]: { ...prev[subjectId], schedule_id: res.data.schedule_id } }));
        showToast('Saved');
      }
    } catch (e) {
      showToast(normalizeError(e).message, 'error');
    } finally {
      setSaving(prev => ({ ...prev, [subjectId]: false }));
    }
  };

  const handleSaveAll = async () => {
    const filled = subjects.filter(s => rows[s.subject_id]?.exam_date);
    for (const s of filled) await handleSaveRow(s.subject_id);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await axiosInstance.put(`/admin/events/${event.event_id}/publish-admit-cards`, {});
      showToast('Admit cards published');
      setTimeout(() => { onPublished?.(); }, 1200);
    } catch (e) {
      showToast(normalizeError(e).message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const savedCount = subjects.filter(s => rows[s.subject_id]?.schedule_id).length;

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-text-tertiary">
        {savedCount > 0
          ? `${savedCount} / ${subjects.length} scheduled`
          : 'No subjects scheduled yet'}
      </span>
      <div className="flex gap-3">
        <button
          onClick={handleSaveAll}
          disabled={subjects.length === 0}
          className="h-9 px-4 text-sm font-medium text-text-primary border border-border-default rounded-sm hover:bg-bg-secondary disabled:opacity-40 transition-colors duration-normal"
        >
          Save All
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing || savedCount === 0}
          className="h-9 px-4 text-sm font-medium text-bg-primary bg-text-primary rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-normal flex items-center gap-2"
        >
          {publishing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />}
          {event.admit_cards_released ? 'Re-publish' : 'Publish Admit Cards'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={`Schedule — ${event.program_code} · Sem ${event.semester} · ${event.academic_year}`}
        size="lg"
        footer={footer}
      >
        {loadingInit ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <AlertCircle className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No subjects found</p>
            <p className="text-xs text-text-tertiary">
              Upload THEORY subjects for {event.program_code} Sem {event.semester} via Bulk Uploads first.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subjects.map(subj => {
              const row      = rows[subj.subject_id] || {};
              const isSaving = saving[subj.subject_id];
              const saved    = !!row.schedule_id;

              return (
                <div
                  key={subj.subject_id}
                  className={cn(
                    'p-4 rounded-sm border transition-colors duration-normal',
                    saved
                      ? 'border-accent-green/30 bg-accent-green/5'
                      : 'border-border-default bg-bg-secondary'
                  )}
                >
                  {/* Subject header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-medium text-text-secondary shrink-0">
                        {subj.subject_code}
                      </span>
                      <span className="text-sm text-text-primary truncate">{subj.subject_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {saved && (
                        <span className="text-[11px] font-medium text-accent-green flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Saved
                        </span>
                      )}
                      <button
                        onClick={() => handleSaveRow(subj.subject_id)}
                        disabled={isSaving}
                        className="h-7 px-3 text-xs font-medium border border-border-default rounded-sm hover:bg-bg-primary disabled:opacity-40 transition-colors duration-normal flex items-center gap-1.5 text-text-secondary"
                      >
                        {isSaving
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : null}
                        {saved ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Input row */}
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-text-tertiary mb-1">Date</label>
                      <input
                        type="date"
                        value={row.exam_date || ''}
                        onChange={e => updateRow(subj.subject_id, 'exam_date', e.target.value)}
                        className={scheduleInputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-text-tertiary mb-1">Start</label>
                      <input
                        type="time"
                        value={row.start_time || ''}
                        onChange={e => updateRow(subj.subject_id, 'start_time', e.target.value)}
                        className={scheduleInputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-text-tertiary mb-1">End</label>
                      <input
                        type="time"
                        value={row.end_time || ''}
                        onChange={e => updateRow(subj.subject_id, 'end_time', e.target.value)}
                        className={scheduleInputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-text-tertiary mb-1">Session</label>
                      <select
                        value={row.session || 'MORNING'}
                        onChange={e => updateRow(subj.subject_id, 'session', e.target.value)}
                        className={scheduleInputCls}
                      >
                        {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]',
          'px-4 py-2.5 rounded-sm shadow-lg',
          'text-sm font-medium flex items-center gap-2',
          'animate-fade-in',
          toast.type === 'error'
            ? 'bg-accent-red text-white'
            : 'bg-text-primary text-bg-primary'
        )}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4" />
            : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ─── Event Row Card ───────────────────────────────────────────────────────────
function EventCard({ event, onSchedule }) {
  return (
    <Card hoverable className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: identity */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold text-text-primary">
                {event.program_code}
              </span>
              <span className="text-xs text-text-tertiary">Sem {event.semester}</span>
              <StatusChip status={event.event_type} />
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">{event.academic_year}</p>
          </div>
        </div>

        {/* Middle: dates + fees */}
        <div className="flex flex-wrap gap-6 text-xs text-text-secondary">
          <div>
            <p className="text-text-tertiary mb-0.5">Registration</p>
            <p className="font-medium text-text-primary">
              {event.registration_start?.slice(0, 10)} → {event.registration_end?.slice(0, 10)}
            </p>
            <p className="text-text-tertiary mt-0.5">Late: {event.late_fee_end?.slice(0, 10)}</p>
          </div>
          <div>
            <p className="text-text-tertiary mb-0.5">Fees</p>
            <p className="font-medium text-text-primary">₹{event.base_fee}</p>
            <p className="text-text-tertiary mt-0.5">Late +₹{event.late_fee}</p>
          </div>
          <div>
            <p className="text-text-tertiary mb-0.5">Admit Cards</p>
            <span className={cn(
              'inline-block text-[11px] font-medium px-2 py-0.5 rounded-sm',
              event.admit_cards_released
                ? 'bg-accent-green/10 text-accent-green'
                : 'bg-bg-secondary text-text-tertiary border border-border-default'
            )}>
              {event.admit_cards_released ? 'Released' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Right: action */}
        <button
          onClick={() => onSchedule(event)}
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-text-primary border border-border-default rounded-sm hover:bg-bg-secondary transition-colors duration-normal shrink-0"
        >
          <CalendarDays className="w-4 h-4" />
          Schedule
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ExamEventsPage = () => {
  const [showCreate,    setShowCreate]    = useState(false);
  const [scheduleEvent, setScheduleEvent] = useState(null);

  const { data: events,   loading, error, execute: reload } = useFetch(fetchEvents);
  const { data: programs }                                   = useFetch(fetchPrograms);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Exam Events</h2>
          <p className="text-sm text-text-secondary">Manage examination events and schedules</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-4 text-sm font-medium text-bg-primary bg-text-primary rounded-sm hover:opacity-90 transition-opacity duration-normal"
        >
          <PlusCircle className="w-4 h-4" />
          Create Event
        </button>
      </section>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
      ) : !events?.length ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <CalendarDays className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No exam events yet</p>
            <p className="text-xs text-text-tertiary">Click "Create Event" to add examination events.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 animate-fade-in-stagger">
          {events.map(event => (
            <EventCard
              key={event.event_id}
              event={event}
              onSchedule={setScheduleEvent}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateEventModal
          programs={programs || []}
          onClose={() => setShowCreate(false)}
          onSuccess={reload}
        />
      )}

      {scheduleEvent && (
        <ScheduleModal
          event={scheduleEvent}
          onClose={() => setScheduleEvent(null)}
          onPublished={() => { setScheduleEvent(null); reload(); }}
        />
      )}
    </div>
  );
};

export default ExamEventsPage;
