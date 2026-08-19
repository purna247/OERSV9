import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, Sun, Moon, User, KeyRound, LogOut, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import axiosInstance from '../../services/api/axiosInstance';

/* ── Change Password Modal ─────────────────────────────────── */
function ChangePasswordModal({ onClose }) {
  const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]       = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  const toggle = (field) => setShow(p => ({ ...p, [field]: !p[field] }));
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) { setError('New passwords do not match'); return; }
    if (form.next.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError(null);
    try {
      await axiosInstance.post('/auth/change-password', {
        current_password: form.current,
        new_password: form.next,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-10 px-3 pr-10 text-sm bg-bg-primary text-text-primary border border-border-default rounded-sm focus:outline-none focus:border-text-secondary transition-colors duration-normal';

  const PasswordField = ({ name, label }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      <div className="relative">
        <input
          type={show[name] ? 'text' : 'password'}
          name={name}
          value={form[name]}
          onChange={handle}
          required
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => toggle(name)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
        >
          {show[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-bg-primary border border-border-default rounded-md shadow-lg w-full max-w-sm animate-modal-content">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h2 className="text-sm font-semibold text-text-primary">Change Password</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PasswordField name="current" label="Current Password" />
          <PasswordField name="next"    label="New Password" />
          <PasswordField name="confirm" label="Confirm New Password" />

          {error && <p className="text-xs text-accent-red">{error}</p>}
          {success && <p className="text-xs text-accent-green">Password changed successfully!</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 text-sm font-medium text-text-secondary border border-border-default rounded-sm hover:bg-bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 h-9 text-sm font-medium text-bg-primary bg-text-primary rounded-sm hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── TopBar ────────────────────────────────────────────────── */
export const TopBar = ({ toggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const menuRef = useRef(null);

  const avatarUrl =
    user?.photo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(role || 'U')}&background=121317&color=ffffff&size=80&bold=true`;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const profilePath = role === 'student' ? '/student/profile' : null;

  const menuItems = [
    ...(profilePath ? [{
      icon: User,
      label: 'Profile',
      onClick: () => { navigate(profilePath); setMenuOpen(false); },
    }] : []),
    {
      icon: KeyRound,
      label: 'Change Password',
      onClick: () => { setShowChangePw(true); setMenuOpen(false); },
    },
    {
      icon: LogOut,
      label: 'Logout',
      onClick: () => { logout(); setMenuOpen(false); },
      danger: true,
    },
  ];

  return (
    <>
      <header className={cn(
        'fixed top-0 right-0 left-0 lg:left-64 z-40 h-16',
        'bg-bg-primary border-b border-border-default',
      )}>
        <div className="flex items-center justify-between h-full px-5">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-sm cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors duration-normal"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <div>
              <span className="text-base font-semibold tracking-tight text-text-primary">OERS</span>
              <span className="hidden sm:inline text-xs text-text-tertiary ml-2">Online Exam Registration System</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-sm cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors duration-normal"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun  className="w-4 h-4" strokeWidth={1.5} />
                : <Moon className="w-4 h-4" strokeWidth={1.5} />}
            </button>

            {/* Avatar + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(p => !p)}
                className="w-8 h-8 rounded-sm overflow-hidden border border-border-default bg-bg-secondary shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="User menu"
                aria-expanded={menuOpen}
              >
                <img src={avatarUrl} alt={`${role || 'User'} avatar`} className="w-full h-full object-cover" />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-bg-primary border border-border-default rounded-md shadow-lg z-50 animate-fade-in overflow-hidden">
                  {/* Role label */}
                  <div className="px-3 py-2.5 border-b border-border-default">
                    <p className="text-xs font-medium text-text-primary capitalize">{role || 'User'}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">OERS Portal</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {menuItems.map(({ icon: Icon, label, onClick, danger }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors duration-normal',
                          danger
                            ? 'text-accent-red hover:bg-accent-red/5'
                            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </>
  );
};

export default TopBar;
