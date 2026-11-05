import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Phone, CheckCircle2, Shield, X, ArrowRight, Sparkles } from 'lucide-react';

export const MobilePromptModal: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Check if user has no phone saved and has not skipped this session
    const hasPrompted = sessionStorage.getItem(`dhru_phone_prompted_${user.uid}`);
    if (!user.phone && !hasPrompted) {
      // Delay prompt by 1.5s so user can land on the dashboard first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSkip = () => {
    sessionStorage.setItem(`dhru_phone_prompted_${user.uid}`, 'skipped');
    setIsOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = phoneNumber.trim().replace(/\s+/g, '');
    const digitsOnly = clean.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number');
      return;
    }

    setSaving(true);
    const formatted = clean.startsWith('+') ? clean : `+91 ${digitsOnly.slice(-10)}`;

    updateUserProfile({
      phone: formatted,
      kycStatus: 'verified'
    });

    sessionStorage.setItem(`dhru_phone_prompted_${user.uid}`, 'saved');
    setSaving(false);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface border border-line rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-brand-fill/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink tracking-tight">Complete Profile</h3>
              <p className="text-xs text-ink-2">Link mobile number to your account</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 rounded-xl text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-surface-2 border border-line flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-brand" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-fill text-white font-black text-sm flex items-center justify-center">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-ink truncate">{user.displayName}</div>
              <div className="text-xs text-ink-2 truncate">{user.email}</div>
            </div>
          </div>

          <p className="text-xs text-ink-2 leading-relaxed">
            Welcome to DHRU.AI! Please update your mobile number to receive instant notifications for auto-trade executions, stop-loss triggers, and UPI payment approvals.
          </p>

          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Mobile Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-ink-3">🇮🇳 +91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => {
                    setError('');
                    setPhoneNumber(e.target.value);
                  }}
                  placeholder="98765 43210"
                  className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-surface border border-line focus:border-brand outline-none text-xs font-mono font-bold text-ink"
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-ink-3">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Used exclusively for two-factor security alerts and payment verification.</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-ink-2 font-bold text-xs transition-all cursor-pointer"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-fill hover:bg-brand-hover text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Save Mobile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
