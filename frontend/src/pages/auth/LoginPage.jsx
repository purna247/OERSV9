import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LogIn } from 'lucide-react';
import { ROLES } from '../../utils/constants';

export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      addToast('Please enter both identifier and password', 'error');
      return;
    }

    setIsLoading(true);
    const result = await login(identifier, password);
    setIsLoading(false);

    if (result.success) {
      addToast('Login successful', 'success');
      
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (result.role === ROLES.ADMIN) navigate('/admin/dashboard', { replace: true });
        else if (result.role === ROLES.STUDENT) navigate('/student/dashboard', { replace: true });
        else if (result.role === ROLES.ADVISOR) navigate('/advisor/dashboard', { replace: true });
        else navigate('/', { replace: true });
      }
    } else {
      addToast(result.error || 'Login failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-clay-bg flex flex-col items-center justify-center p-6">
      <div className="clay-card w-full max-w-md p-8 space-y-8 animate-in slide-in-from-bottom-5">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-soft-purple/10 rounded-2xl flex items-center justify-center text-soft-purple mx-auto mb-6 shadow-inner">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black font-headline text-text-dark tracking-tight">OERS<span className="text-soft-purple">v9</span></h1>
          <p className="text-sm font-medium text-text-muted">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Registration No. / Email"
            type="text"
            placeholder="e.g. 211CS001 or admin@college.edu"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={isLoading}
          />
          <Input 
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="w-full mt-2" 
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
