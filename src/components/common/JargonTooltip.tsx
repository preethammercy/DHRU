import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export type JargonTerm = 'SMC' | 'FVG' | 'OTE' | 'BOS' | 'OB' | 'CHoCH' | 'SWEEP';

interface TermDefinition {
  title: string;
  fullName: string;
  explanation: string;
  example?: string;
}

const DEFINITIONS: Record<string, TermDefinition> = {
  SMC: {
    title: 'SMC',
    fullName: 'Smart Money Concepts',
    explanation: 'An institutional price-action framework tracking how central banks, hedge funds, and algorithms accumulate, manipulate, and distribute liquidity before major market movements.',
    example: 'Identifies institutional footprints rather than traditional retail lag indicators.'
  },
  FVG: {
    title: 'FVG',
    fullName: 'Fair Value Gap (Imbalance)',
    explanation: 'A 3-candle price imbalance where sudden aggressive algorithmic buying or selling leaves an unfilled gap between candle 1\'s extreme and candle 3\'s opposite extreme. Markets gravitate back to rebalance this vacuum.',
    example: 'Acts as a high-probability institutional magnet and entry support/resistance.'
  },
  OTE: {
    title: 'OTE',
    fullName: 'Optimal Trade Entry',
    explanation: 'The prime institutional Fibonacci discount/premium zone (typically 62% to 79% retracement of the swing impulse) where algorithms enter continuation moves with tight invalidation.',
    example: 'Minimizes stop-loss distance while maximizing risk-to-reward ratio.'
  },
  BOS: {
    title: 'BOS',
    fullName: 'Break of Structure',
    explanation: 'A volume-confirmed candle close beyond a significant prior swing high or low in the prevailing trend direction, verifying continued institutional expansion.',
    example: 'Signals strong trend continuation; entries are sought on subsequent pullbacks.'
  },
  OB: {
    title: 'OB',
    fullName: 'Order Block',
    explanation: 'The final opposing candle before an aggressive impulse move that created a Break of Structure (BOS). Represents where institutions accumulated large order volumes.',
    example: 'Price frequently bounces or reverses sharply upon retesting this zone.'
  },
  CHoCH: {
    title: 'CHoCH',
    fullName: 'Change of Character',
    explanation: 'The first structural break against the current market direction, signaling an early institutional trend reversal before a formal multi-swing BOS is confirmed.',
    example: 'Early warning to stop trading the previous trend and prepare for reversals.'
  },
  SWEEP: {
    title: 'SWEEP',
    fullName: 'Liquidity Sweep',
    explanation: 'A false breakout where price briefly wicks beyond an obvious retail support/resistance level to trigger stop-losses and absorb liquidity, followed by an immediate reversal.',
    example: 'Also known as a stop run or liquidity grab.'
  }
};

interface JargonTooltipProps {
  term: JargonTerm | string;
  children?: React.ReactNode;
  inline?: boolean;
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({ term, children, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const normalized = term.toUpperCase().trim();
  const def = DEFINITIONS[normalized] || {
    title: term,
    fullName: term,
    explanation: 'Institutional quantitative analysis term used in DHRU.AI algorithmic models.'
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span ref={containerRef} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`inline-flex items-center gap-1 cursor-pointer transition-colors focus:outline-none ${
          inline
            ? 'underline decoration-dotted decoration-brand/60 underline-offset-2 hover:decoration-brand'
            : 'text-ink-3 hover:text-brand p-0.5 rounded'
        }`}
        aria-label={`Definition of ${def.fullName}`}
      >
        {children ? (
          children
        ) : (
          <>
            <span className="font-semibold">{def.title}</span>
            <HelpCircle className="w-3 h-3 text-brand/70 hover:text-brand shrink-0" />
          </>
        )}
      </button>

      {isOpen && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 sm:w-72 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs shadow-xl border border-slate-700/80 pointer-events-auto select-text normal-case font-sans tracking-normal text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex items-center gap-1.5 font-bold text-sky-400 mb-1 border-b border-slate-800 pb-1">
            <Info className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            <span className="truncate">{def.fullName}</span>
          </span>
          <span className="block text-slate-300 text-[11px] leading-relaxed mb-1.5">
            {def.explanation}
          </span>
          {def.example && (
            <span className="block text-[10px] text-amber-300/90 italic bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
              💡 {def.example}
            </span>
          )}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
};
