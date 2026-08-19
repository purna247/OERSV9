import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../services/api/adminApi';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { Users, Calendar, UserCheck, CreditCard, PlusCircle, Upload, BarChart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Minimal stat card
const StatItem = ({ icon: Icon, label, value, alert = false }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
        <p className={cn('text-3xl font-semibold mt-1', alert ? 'text-accent-red' : 'text-text-primary')}>
          {value}
        </p>
      </div>
      <div className="w-9 h-9 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
    </div>
  </Card>
);

// Quick action row
const ActionRow = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full h-12 px-4 rounded-sm border border-border-default hover:bg-bg-secondary transition-colors duration-normal text-sm font-medium text-text-primary"
  >
    <span className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-text-tertiary" strokeWidth={1.5} />
      {label}
    </span>
    <ArrowRight className="w-4 h-4 text-text-tertiary" />
  </button>
);

// Payment status → badge variant
const paymentVariant = (status) => {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (s === 'PAID' || s === 'CONFIRMED') return 'success';
  if (s === 'PENDING') return 'warning';
  if (s === 'FAILED')  return 'error';
  return 'neutral';
};

export const AdminDashboardPage = () => {
  const { data: summary, loading, error, execute: reload } = useFetch(adminApi.getDashboardSummary);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const stats = summary?.stats || { totalStudents: 0, totalEvents: 0, activeRegistrations: 0, pendingPayments: 0 };
  const recentRegistrations = summary?.recentRegistrations || [];
  const activities = summary?.activities || [];
  const firstName = summary?.name?.split(' ')[0] || '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="text-sm text-text-secondary">Managing the examination registration system</p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-stagger">
        <StatItem icon={Users}     label="Total Students"       value={stats.totalStudents} />
        <StatItem icon={Calendar}  label="Total Events"         value={stats.totalEvents} />
        <StatItem icon={UserCheck} label="Active Registrations" value={stats.activeRegistrations} />
        <StatItem icon={CreditCard} label="Pending Payments"    value={stats.pendingPayments} alert={stats.pendingPayments > 0} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: quick actions + activity */}
        <div className="space-y-6">
          <Card header={<p className="text-sm font-medium text-text-primary">Quick Actions</p>}>
            <div className="space-y-2">
              <ActionRow icon={PlusCircle} label="Create Event"     onClick={() => navigate('/admin/events')} />
              <ActionRow icon={Upload}     label="Upload Students"  onClick={() => navigate('/admin/upload-students')} />
              <ActionRow icon={BarChart}   label="View Reports"     onClick={() => navigate('/admin/reports')} />
            </div>
          </Card>

          {activities.length > 0 && (
            <Card header={<p className="text-sm font-medium text-text-primary">Recent Activity</p>}>
              <div className="space-y-4">
                {activities.map((a, i) => (
                  <div key={a.id || i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-text-primary">{a.title}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{a.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: recent registrations */}
        <div className="lg:col-span-2">
          <Card header={
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">Recent Registrations</p>
              <span className="text-xs text-text-tertiary">Last 5</span>
            </div>
          }>
            {recentRegistrations.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4 text-center">No recent registrations.</p>
            ) : (
              <div className="divide-y divide-border-subtle">
                {recentRegistrations.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{r.student_name}</p>
                      <p className="text-xs text-text-tertiary font-mono mt-0.5">{r.reg_no}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary hidden sm:block">{r.event_name}</span>
                      <Badge variant={paymentVariant(r.payment_status)}>{r.payment_status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
