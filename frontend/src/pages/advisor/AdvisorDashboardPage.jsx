import React from 'react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { ErrorState } from '../../components/common/ErrorState';
import axiosInstance from '../../services/api/axiosInstance';

const fetchAdvisorDashboard = () =>
  axiosInstance.get('/advisor/dashboard').then(r => r.data);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Minimal stat card using design tokens
const StatItem = ({ icon: Icon, label, value, alert = false }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-semibold mt-1 ${alert ? 'text-accent-red' : 'text-text-primary'}`}>
          {value}
        </p>
      </div>
      <div className="w-9 h-9 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center">
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
    </div>
  </Card>
);

// Quick action card
const ActionCard = ({ icon: Icon, title, description, label, onClick }) => (
  <Card hoverable>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-text-secondary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-text-secondary border border-border-default rounded-sm hover:bg-bg-secondary transition-colors duration-normal shrink-0"
      >
        {label}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  </Card>
);

export const AdvisorDashboardPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, execute: reload } = useFetch(fetchAdvisorDashboard);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">
          {getGreeting()}{data?.name ? `, ${data.name.split(' ')[0]}` : ''}
        </h2>
        <p className="text-sm text-text-secondary">
          {data?.program_code
            ? `Managing ${data.program_code} · Semester ${data.semester}`
            : 'Welcome to your advisor dashboard'}
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-stagger">
        <StatItem icon={Users}        label="Assigned Students"      value={data?.assigned_students ?? 0} />
        <StatItem icon={FileText}     label="Pending Attendance"     value={data?.pending_attendance ?? 0} alert={data?.pending_attendance > 0} />
        <StatItem icon={CheckCircle2} label="Confirmed Registrations" value={data?.confirmed_registrations ?? 0} />
      </section>

      {/* Quick actions */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Quick Actions</h3>
        <div className="space-y-3 animate-fade-in-stagger">
          <ActionCard
            icon={FileText}
            title="Upload Attendance"
            description="Submit monthly attendance sheets for your assigned batch"
            label="Upload"
            onClick={() => navigate('/advisor/attendance')}
          />
          <ActionCard
            icon={Users}
            title="View Students"
            description="Review student details, detentions, and registration statuses"
            label="View"
            onClick={() => navigate('/advisor/students')}
          />
        </div>
      </section>
    </div>
  );
};

export default AdvisorDashboardPage;


