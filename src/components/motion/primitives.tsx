import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Counts smoothly to `value`, writing to the DOM directly for performance. */
export function AnimatedNumber({ value, decimals = 2, prefix = '', suffix = '', className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !Number.isFinite(value)) return;
    const fmt = (v: number) =>
      `${prefix}${v.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: EASE,
      onUpdate: (v) => { el.textContent = fmt(v); },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, decimals, prefix, suffix]);

  return <span ref={ref} className={className} />;
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export type ThemeName = 'dark' | 'light';
const THEME_KEY = 'dhru:theme';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="btn btn-ghost" aria-label="Toggle theme">
      <motion.span
        key={theme}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        aria-hidden
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </motion.span>
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
