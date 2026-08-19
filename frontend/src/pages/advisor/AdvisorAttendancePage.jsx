import React, { useState, useEffect } from 'react';
import { advisorApi } from '../../services/api/advisorApi';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { FileUploadField } from '../../components/common/FileUploadField';
import { useToast } from '../../hooks/useToast';
import { CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import axiosInstance from '../../services/api/axiosInstance';
import { cn } from '../../utils/cn';

// Shared minimal button style
const btnPrimary = 'h-10 px-5 text-sm font-medium text-bg-primary bg-text-primary rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-normal flex items-center gap-2';
const btnSecondary = 'h-10 px-5 text-sm font-medium text-text-secondary border border-border-default rounded-sm hover:bg-bg-secondary disabled:opacity-40 transition-colors duration-normal';

export const AdvisorAttendancePage = () => {
  const [events,          setEvents]          = useState([]);
  const [loadingEvents,   setLoadingEvents]   = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [file,            setFile]            = useState(null);
  const [isPreviewing,    setIsPreviewing]    = useState(false);
  const [isConfirming,    setIsConfirming]    = useState(false);
  const [previewData,     setPreviewData]     = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    axiosInstance.get('/advisor/events')
      .then(r => {
        setEvents(r.data?.events ?? r.data ?? []);
        const evts = r.data?.events ?? r.data ?? [];
        if (evts.length === 1) setSelectedEventId(String(evts[0].event_id));
      })
      .catch(() => addToast('Could not load events', 'error'))
      .finally(() => setLoadingEvents(false));
  }, []);

  const handlePreview = async () => {
    if (!file || !selectedEventId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', selectedEventId);
    setIsPreviewing(true);
    setPreviewData(null);
    try {
      const response = await advisorApi.previewAttendance(formData);
      setPreviewData(response);
      addToast(`Preview ready — ${response.totalRows} students parsed`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to preview attendance file', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || !selectedEventId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', selectedEventId);
    setIsConfirming(true);
    try {
      const result = await advisorApi.confirmAttendance(formData);
      addToast(`Attendance saved — ${result.saved} records updated`, 'success');
      setFile(null);
      setPreviewData(null);
    } catch (err) {
      addToast(err.message || 'Failed to confirm attendance', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Upload Attendance</h2>
        <p className="text-sm text-text-secondary">Submit monthly attendance records to calculate detentions.</p>
      </section>

      {/* Upload form */}
      <Card>
        <div className="space-y-5">
          {/* Event selector */}
          {loadingEvents ? (
            <Skeleton className="h-10 w-full" />
          ) : events.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-sm border border-accent-red/20 bg-accent-red/5 text-sm text-accent-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No exam events found for your assigned program &amp; semester.
            </div>
          ) : (
            <Select
              label="Exam Event"
              value={selectedEventId}
              onChange={e => { setSelectedEventId(e.target.value); setPreviewData(null); }}
            >
              <option value="">— Choose an event —</option>
              {events.map(ev => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.program_code} · Sem {ev.semester} · {ev.event_type} · {ev.academic_year}
                </option>
              ))}
            </Select>
          )}

          {/* File upload */}
          <FileUploadField
            label="Attendance Sheet"
            accept=".xlsx, .csv"
            onFileSelect={setFile}
            helperText="Accepted formats: .xlsx, .csv — max 5 MB"
          />

          {/* Action */}
          <div className="flex justify-end pt-2 border-t border-border-default">
            <button
              onClick={handlePreview}
              disabled={!file || !selectedEventId || isPreviewing || isConfirming}
              className={btnPrimary}
            >
              {isPreviewing && <Spinner size="sm" />}
              <Upload className="w-4 h-4" />
              Preview Data
            </button>
          </div>
        </div>
      </Card>

      {/* Preview results */}
      {previewData && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary card */}
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Preview — {previewData.totalRows} students
                </h3>
                <Badge variant={previewData.unknownRegNos?.length > 0 ? 'warning' : 'success'}>
                  {previewData.unknownRegNos?.length > 0 ? 'Warnings' : 'Ready'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {previewData.recognisedSubjects?.map(s => (
                  <Badge key={s} variant="info">{s}</Badge>
                ))}
              </div>

              {previewData.ignoredColumns?.length > 0 && (
                <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-accent-red shrink-0" />
                  Ignored columns: {previewData.ignoredColumns.join(', ')}
                </p>
              )}
              {previewData.unknownRegNos?.length > 0 && (
                <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-accent-red shrink-0" />
                  {previewData.unknownRegNos.length} unknown registration number(s)
                </p>
              )}

              <p className="text-xs text-text-tertiary">
                Students below 75% in any subject will be marked as detained.
              </p>
            </div>
          </Card>

          {/* Preview table */}
          <Card padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Reg No</th>
                    {previewData.recognisedSubjects?.map(s => (
                      <th key={s} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(previewData.preview || []).map((row, i) => (
                    <tr key={i} className="border-b border-border-subtle hover:bg-bg-secondary transition-colors duration-normal">
                      <td className="px-4 py-3 font-mono text-xs text-text-primary">{row.reg_no}</td>
                      {previewData.recognisedSubjects?.map(s => {
                        const val = row[s];
                        const low = val !== undefined && val < 75;
                        return (
                          <td key={s} className={cn('px-4 py-3 text-xs font-medium', low ? 'text-accent-red' : 'text-accent-green')}>
                            {val !== undefined ? `${val}%` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.totalRows > 5 && (
                <p className="text-xs text-text-tertiary text-center py-3 border-t border-border-subtle">
                  Showing first 5 of {previewData.totalRows} students
                </p>
              )}
            </div>
          </Card>

          {/* Confirm actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setPreviewData(null)}
              disabled={isConfirming}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className={btnPrimary}
            >
              {isConfirming ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm &amp; Apply Detentions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorAttendancePage;
