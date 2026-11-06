// DHRU.AI - Privacy Policy & Regulatory Disclosure
import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, Database, Scale, ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate?: (nav: string) => void;
}

export const PrivacyPolicyPage: React.FC<Props> = ({ onNavigate }) => {
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

        <div className="flex items-center gap-2">
          <span className="p-2.5 rounded-2xl bg-brand/10 text-brand border border-brand/20">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Privacy Policy &amp; Security Charter
            </h1>
            <p className="text-xs text-ink-2 font-mono mt-0.5">
              Effective Date: November 2026 • Platform Security Standard ISO/IEC 27001 Aligned
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-ink-2">
        {/* 1. Introduction */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-ink font-bold text-base">
            <Lock className="w-4 h-4 text-brand" />
            <h2>1. Commitment to Data Privacy</h2>
          </div>
          <p>
            At <strong>DHRU.AI</strong> (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we take your privacy, cybersecurity, and personal data protection seriously. This Privacy Policy outlines our transparent protocols for collecting, storing, processing, and safeguarding your information when you interact with our quantitative market intelligence, algorithmic simulations, and payment portals.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-ink font-bold text-base">
            <Database className="w-4 h-4 text-brand" />
            <h2>2. Information We Collect</h2>
          </div>
          <p>We collect only the essential data required to provide institutional analytics and maintain isolated user accounts:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Authentication Identity:</strong> Display name, email address, and Google OAuth UID used to maintain your segregated portfolio and virtual simulation margin.</li>
            <li><strong>Contact Details:</strong> Verified phone numbers or WhatsApp contact provided during onboarding or support inquiries.</li>
            <li><strong>Financial References (UPI &amp; Banking):</strong> 12-digit transaction UTR reference numbers submitted for manual payment verification. We do not store banking passwords, UPI PINs, or raw credit card data.</li>
            <li><strong>Analytical Telemetry:</strong> Anonymized interaction telemetry, algorithmic order history, risk limits, and paper trade execution logs.</li>
          </ul>
        </section>

        {/* 3. Zero-Sale Policy */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-ink font-bold text-base">
            <Eye className="w-4 h-4 text-brand" />
            <h2>3. Zero-Sale of Personal Data</h2>
          </div>
          <p>
            <strong>We strictly never sell, rent, or monetize your personal data to third-party advertisers, data brokers, or external marketing entities.</strong> Your information is utilized strictly to provide real-time market data streaming, algorithmic analysis, and user portfolio accounting.
          </p>
        </section>

        {/* 4. Encryption & High Security */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-ink font-bold text-base">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h2>4. High-Security Encryption Standards</h2>
          </div>
          <p>
            All network communication with DHRU.AI is enforced with <strong>TLS 1.3 Transport Layer Security</strong> and HTTPS encryption. Stored order records, portfolio balances, and user credentials utilize AES-256 bit encryption at rest. Internal administrative tools are strictly locked to the Super Admin account (<strong>preethamjee2008@gmail.com</strong>).
          </p>
        </section>

        {/* 5. Educational Paper Trading & Regulatory Disclaimer */}
        <section className="space-y-3 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-ink">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 text-sm">
            <Scale className="w-4 h-4" />
            <h2>5. Regulatory &amp; Financial Risk Disclosure</h2>
          </div>
          <p className="text-xs leading-relaxed">
            DHRU.AI is a financial market intelligence, algorithmic research, and educational simulation platform. Quantitative entry zones, Smart Money Concepts (SMC) models, Order Blocks, Fair Value Gaps, and Stop-Loss ratchets are algorithmic quantitative models designed for decision support and risk education. DHRU.AI is not a SEBI-registered financial advisory or broker. Trading in securities and digital assets involves inherent market risk.
          </p>
        </section>

        {/* 6. Contact & Data Protection Officer */}
        <section className="space-y-3 pt-4 border-t border-line">
          <div className="flex items-center gap-2 text-ink font-bold text-base">
            <FileText className="w-4 h-4 text-brand" />
            <h2>6. Data Protection &amp; Contact Inquiries</h2>
          </div>
          <p className="text-xs sm:text-sm">
            For privacy inquiries, data deletion requests, or technical support, please contact our administrative desk:
          </p>
          <div className="p-4 rounded-xl bg-surface-2 border border-line text-xs font-mono space-y-1">
            <p><strong>Platform:</strong> DHRU.AI Quantitative Markets</p>
            <p><strong>Super Admin &amp; Data Officer:</strong> <a href="mailto:preethamjee2008@gmail.com" className="text-brand hover:underline">preethamjee2008@gmail.com</a></p>
            <p><strong>Official Instagram:</strong> <a href="https://instagram.com/dhruai.in" target="_blank" rel="noreferrer" className="text-pink-500 hover:underline">@dhruai.in</a></p>
            <p><strong>Developer Instagram:</strong> <a href="https://instagram.com/preetham_va" target="_blank" rel="noreferrer" className="text-pink-500 hover:underline">@preetham_va</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};
