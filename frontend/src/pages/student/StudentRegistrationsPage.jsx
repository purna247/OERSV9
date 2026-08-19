import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { studentApi } from '../../services/api/studentApi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { formatCurrency } from '../../utils/formatters';
import { FileText, BookOpen } from 'lucide-react';

const paymentVariant = (s) => {
  if (!s) return 'neutral';
  const u = s.toUpperCase();
  if (u === 'CONFIRMED' || u === 'PAID') return 'success';
  if (u === 'PENDING')  return 'warning';
  if (u === 'FAILED')   return 'error';
  return 'neutral';
};

export const StudentRegistrationsPage = () => {
  const { data: registrations, loading, error, execute: reload } = useFetch(studentApi.getRegistrations);

  const handleAdmitCard = (eventId) => {
    window.open(`/student/admit-card?event_id=${eventId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">My Registrations</h2>
        <p className="text-sm text-text-secondary">Your past and current examination registrations</p>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !registrations?.length ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No registrations yet</p>
            <p className="text-xs text-text-tertiary">Register for an exam event to see it here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 animate-fade-in-stagger">
          {registrations.map((r, i) => (
            <Card key={r.registration_id || i} hoverable>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-primary">{r.program_code} · Sem {r.semester}</span>
                    <Badge variant="neutral">{r.event_type}</Badge>
                    <Badge variant={paymentVariant(r.payment_status)}>{r.payment_status}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{r.academic_year}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {r.fee_paid > 0 && (
                    <span className="text-sm font-medium text-text-primary">{formatCurrency(r.fee_paid)}</span>
                  )}
                  <button
                    onClick={() => handleAdmitCard(r.event_id)}
                    disabled={r.payment_status?.toUpperCase() !== 'CONFIRMED'}
                    className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-text-secondary border border-border-default rounded-sm hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-normal"
                    title={r.payment_status !== 'CONFIRMED' ? 'Complete payment to access admit card' : 'View admit card'}
                  >
                    <FileText className="w-4 h-4" />
                    Admit Card
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentRegistrationsPage;
