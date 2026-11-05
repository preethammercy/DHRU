export function getChartTheme(dark: boolean) {
  const token = (name: string, fallback: string) => typeof document === 'undefined'
    ? fallback
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  return {
    surface: 'rgba(0,0,0,0)', surface2: token('--surface-2', dark ? '#111925' : '#F3F8FB'),
    border: token('--border', dark ? '#1B2735' : '#DCE7EE'), text: token('--text-3', dark ? '#91A2B1' : '#5F7180'), text2: token('--text-2', dark ? '#BECBD5' : '#334155'),
    focus: token('--focus', dark ? '#38BDF8' : '#0284C7'), grid: dark ? 'rgba(145,162,177,0.06)' : 'rgba(95,113,128,0.06)',
    primary: token('--primary', dark ? '#38BDF8' : '#0369A1'), pos: token('--pos', dark ? '#22C55E' : '#15803D'),
    neg: token('--neg', dark ? '#EF4444' : '#B91C1C'), warn: token('--warn', dark ? '#38BDF8' : '#0369A1'),
    positive: '#22C55E', negative: '#EF4444',
    info: token('--info', dark ? '#38BDF8' : '#0369A1'), ai: token('--ai', dark ? '#9B8CFF' : '#6D5AE0'), neutral: token('--text-3', dark ? '#8A94A8' : '#64748B'),
    vwap: dark ? '#F97316' : '#C2410C', candleText: dark ? '#05070B' : '#FFFFFF',
  };
}

export const CHART_PALETTE = {
  primary: '#38BDF8', info: '#38BDF8', pos: '#22C55E', neg: '#EF4444', warn: '#38BDF8', ai: '#7C6CF2', neutral: '#94A3B8',
} as const;
