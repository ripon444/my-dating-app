import React, { useState } from 'react';
import { Heart, Lock, Mail, User as UserIcon, Calendar, Check, AlertCircle, X, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { User, Profile } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, profile: Profile) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Form input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER'>('FEMALE');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = (targetMode: 'login' | 'register') => {
    setMode(targetMode);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      // Standard regular User login
      const res = await api.login(email.trim(), password, 'USER');
      if (res.user && res.profile) {
        onAuthSuccess(res.user, res.profile);
        onClose();
      } else {
        throw new Error('Could not authenticate user profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!dob) {
      setError('Please provide your date of birth.');
      return;
    }

    // Age Gate verification: must be 18+
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (isNaN(calculatedAge) || calculatedAge < 18) {
      setError('You must be at least 18 years old to join Global Match.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      // Call register endpoint
      const res = await api.register({
        email: email.trim(),
        password,
        name: name.trim(),
        dob,
        gender,
      });

      // STRICT REQUIREMENT: DO NOT auto login!
      // Display success message and switch to login mode so user manually logs in.
      setSuccessMessage(
        res.message || 'Registration successful! Please log in with your email and password to enter.'
      );
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try a different email or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-md rounded-3xl border border-stone-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-900/40 mb-3">
          <Heart className="w-6 h-6 text-white fill-white" />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-1 mb-4">
          <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
            {mode === 'login' ? 'User Login' : 'Create an Account'}
          </h2>
          <p className="text-xs text-stone-400">
            {mode === 'login'
              ? 'Log in to connect and chat with verified members worldwide'
              : 'Join the global community of verified single adults (18+)'}
          </p>
        </div>

        {/* Registration Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs flex items-start gap-2.5 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold text-emerald-300 block mb-0.5">Success!</span>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOGIN FORM */}
        {/* ========================================================================= */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-10 pr-3 py-2.5 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-stone-300">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold transition shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 mt-3 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isLoading ? 'Logging in...' : 'Log In'}</span>
            </button>
          </form>
        ) : (
          /* ========================================================================= */
          /* REGISTRATION FORM */
          /* ========================================================================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-300">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samantha Jones"
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-10 pr-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Date of Birth */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-stone-300">Date of Birth</label>
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                    18+ Only
                  </span>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-9 pr-2 py-2 text-stone-100 focus:outline-none focus:border-rose-500 text-xs transition"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500 text-xs transition"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="NON_BINARY">Non-Binary</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-10 pr-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-300">Create Password (Min 6 chars)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-10 pr-10 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-rose-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-stone-400 hover:text-stone-200 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-300">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-10 pr-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold transition shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}

        {/* Mode Switcher */}
        <div className="mt-4 pt-3 border-t border-stone-800 text-center text-xs text-stone-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleResetForm('register')}
                className="text-rose-400 font-bold hover:underline ml-1 cursor-pointer"
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleResetForm('login')}
                className="text-rose-400 font-bold hover:underline ml-1 cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
export default AuthModal;
