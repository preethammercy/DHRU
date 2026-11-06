// DHRU.AI - Contact Us & Trader Help Center
import React, { useState } from 'react';
import { 
  Mail, Phone, MessageSquare, Send, CheckCircle2, 
  Sparkles, ArrowLeft, ShieldCheck, Instagram, Globe 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate?: (nav: string) => void;
}

export const ContactUsPage: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState('Platform Support & Inquiries');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          message: message.trim()
        })
      });

      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
        setMessage('');
      } else {
        setError(data.error || 'Failed to submit message.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-32 pt-4 px-4 sm:px-0">
      {/* Header */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-4 shadow-sm">
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-ink-2 hover:text-brand transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Platform</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-brand/10 text-brand border border-brand/20">
            <MessageSquare className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Contact &amp; Trader Help Center
            </h1>
            <p className="text-xs text-ink-2 font-mono mt-0.5">
              Direct line to DHRU.AI Central Operations &amp; Super Admin
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Direct Contact Info & Socials */}
        <div className="space-y-4 md:col-span-1">
          {/* Email Card */}
          <div className="p-5 rounded-2xl border border-line bg-surface space-y-2">
            <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase font-mono">
              <Mail className="w-4 h-4" />
              <span>Super Admin Mail</span>
            </div>
            <p className="text-xs text-ink-2">For institutional inquiries, approvals, and partnership:</p>
            <a
              href="mailto:preethamjee2008@gmail.com"
              className="text-xs font-mono font-bold text-ink hover:text-brand block break-all pt-1"
            >
              preethamjee2008@gmail.com
            </a>
          </div>

          {/* Social Channels (Instagram) */}
          <div className="p-5 rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent space-y-3">
            <div className="flex items-center gap-2 text-pink-500 font-bold text-xs uppercase font-mono">
              <Instagram className="w-4 h-4" />
              <span>Official Instagram</span>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              Follow our official channels for live market updates, algorithmic signals, and community announcements:
            </p>
            <div className="space-y-2 pt-1 font-mono text-xs">
              <a
                href="https://instagram.com/dhruai.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-pink-500/20 hover:border-pink-500 text-ink font-bold transition-all shadow-xs"
              >
                <span>Platform: @dhruai.in</span>
                <span className="text-[10px] text-pink-500 font-bold">Follow ↗</span>
              </a>

              <a
                href="https://instagram.com/preetham_va"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-purple-500/20 hover:border-purple-500 text-ink font-bold transition-all shadow-xs"
              >
                <span>Developer: @preetham_va</span>
                <span className="text-[10px] text-purple-500 font-bold">Follow ↗</span>
              </a>
            </div>
          </div>

          {/* Security Guarantee Card */}
          <div className="p-5 rounded-2xl border border-line bg-surface space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Priority Support</span>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              All messages submitted through this portal are directly dispatched to our Super Admin Control Desk for rapid response.
            </p>
          </div>
        </div>

        {/* Right Column: Contact & Message Form */}
        <div className="md:col-span-2">
          <div className="p-6 sm:p-8 rounded-3xl border border-line bg-surface shadow-sm">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-ink">Inquiry Received!</h3>
                  <p className="text-xs text-ink-2 max-w-sm mx-auto">
                    Thank you, <strong>{name}</strong>. Your message has been routed to our Super Admin. We will reach back to you via email or phone shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl bg-surface-2 border border-line hover:border-brand text-ink text-xs font-bold font-mono transition-all cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-ink">Send Message to Admin</h2>
                  <p className="text-xs text-ink-2">Have a question about deposits, withdrawals, auto-trading, or features? Reach out below.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink block font-mono">Your Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Preetham"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-xs font-medium outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink block font-mono">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-xs font-medium outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink block font-mono">Phone / WhatsApp (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-xs font-medium outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink block font-mono">Inquiry Topic</label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-xs font-medium outline-none focus:border-brand"
                    >
                      <option value="UPI Deposit & UTR Verification">UPI Deposit &amp; UTR Verification</option>
                      <option value="Withdrawal Assistance">Withdrawal Assistance</option>
                      <option value="Quantitative Auto-Trade Desk">Quantitative Auto-Trade Desk</option>
                      <option value="SMC AI Predictions Suite">SMC AI Predictions Suite</option>
                      <option value="General Support">General Support &amp; Feedback</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink block font-mono">Message / Details *</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your inquiry, order ID, or question in detail..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-xs font-medium outline-none focus:border-brand resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-500 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-brand-fill hover:bg-brand text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Delivering Message...' : 'Submit Message to Admin'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
