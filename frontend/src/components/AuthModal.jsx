import { useState } from 'react';
import { Lock, Mail, X } from 'lucide-react';
import { loginUser } from '../services/api.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, language = 'en' }) {
  const [email, setEmail] = useState('doctor@viora.org');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEnglish = language === 'en';

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginUser({ email, password });
      if (result.user?.role !== 'doctor') {
        setError(isEnglish ? 'Clinician access is required.' : 'चिकित्सक लॉगिन आवश्यक है।');
        return;
      }
      onAuthSuccess(result.user);
    } catch (requestError) {
      setError(requestError.response?.data?.error || (isEnglish ? 'Sign-in failed.' : 'लॉगिन विफल हुआ।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <section className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-3xl bg-slate-900 p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">{isEnglish ? 'Clinician sign in' : 'चिकित्सक लॉगिन'}</h2>
            <p className="mt-1 text-xs text-slate-300">
              {isEnglish ? 'Review and verify patient reports' : 'रोगी की जानकारी की समीक्षा और पुष्टि करें'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label className="block text-sm font-semibold text-slate-700">
            {isEnglish ? 'Email' : 'ईमेल'}
            <span className="relative mt-1 block">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3"
                autoComplete="username"
              />
            </span>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            {isEnglish ? 'Password' : 'पासवर्ड'}
            <span className="relative mt-1 block">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3"
                autoComplete="current-password"
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 py-3 font-bold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? (isEnglish ? 'Signing in…' : 'लॉगिन हो रहा है…') : (isEnglish ? 'Sign in' : 'लॉगिन करें')}
          </button>
        </form>
      </section>
    </div>
  );
}
