import React, { useRef, useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { studentApi } from '../../services/api/studentApi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { BookOpen, Calendar, CheckCircle2, Camera, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function resolvePhotoUrl(url, name) {
  if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'S')}&background=121317&color=ffffff&size=200&bold=true`;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

const statusVariant = (s) => {
  if (!s) return 'neutral';
  const u = s.toUpperCase();
  if (u === 'ACTIVE')   return 'success';
  if (u === 'DETAINED') return 'error';
  return 'neutral';
};

const StatItem = ({ icon: Icon, label, value }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-semibold mt-1 text-text-primary">{value}</p>
      </div>
      <div className="w-9 h-9 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
    </div>
  </Card>
);

export const StudentDashboardPage = () => {
  const { data: profile, loading, error, execute: reload } = useFetch(studentApi.getProfile);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(null);

  const handleAvatarClick = () => { if (!uploading) fileInputRef.current?.click(); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPhoto(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('photo', file);
    setUploading(true);
    try {
      const result = await studentApi.uploadPhoto(formData);
      setLocalPhoto(resolvePhotoUrl(result.profile_photo_url, profile?.name));
      addToast('Profile photo updated', 'success');
    } catch (err) {
      setLocalPhoto(null);
      addToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const photoSrc = localPhoto || resolvePhotoUrl(profile?.photo_url, profile?.name);
  const firstName = profile?.name?.split(' ')[0] || '';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="text-sm text-text-secondary">Welcome to your student portal</p>
      </section>

      {/* Profile card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="w-20 h-20 rounded-sm overflow-hidden border border-border-default bg-bg-secondary block"
              title="Click to change photo"
            >
              <img
                src={photoSrc}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={e => { e.target.onerror = null; e.target.src = resolvePhotoUrl(null, profile?.name); }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                {uploading
                  ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-text-primary">{profile?.name}</h2>
            <p className="text-sm font-mono text-text-secondary mt-0.5">{profile?.reg_no}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <Badge variant="neutral">{profile?.program_code}</Badge>
              <Badge variant="neutral">Semester {profile?.semester}</Badge>
              <Badge variant={statusVariant(profile?.status)}>{profile?.status || 'ACTIVE'}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-stagger">
        <StatItem icon={BookOpen}    label="Current CGPA"          value={profile?.cgpa || 'N/A'} />
        <StatItem icon={CheckCircle2} label="Active Registrations" value={profile?.active_registrations || 0} />
        <StatItem icon={Calendar}    label="Upcoming Exams"        value={profile?.upcoming_exams || 0} />
      </section>

      {/* Quick actions */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Quick Actions</h3>
        <div className="space-y-3">
          {[
            { label: 'Register for Exams',  desc: 'Browse and register for upcoming exam events', path: '/student/events' },
            { label: 'View Registrations',  desc: 'Check your registration history and admit cards', path: '/student/registrations' },
          ].map(({ label, desc, path }) => (
            <Card key={path} hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => navigate(path)}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-text-secondary border border-border-default rounded-sm hover:bg-bg-secondary transition-colors duration-normal shrink-0"
                >
                  Go <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      {profile?.recent_activities?.length > 0 && (
        <Card header={<p className="text-sm font-medium text-text-primary">Recent Activity</p>}>
          <div className="space-y-3">
            {profile.recent_activities.map((a, i) => (
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
  );
};

export default StudentDashboardPage;
