/** @type {import('tailwindcss').Config} */
const semantic = {
  bg:'var(--bg)', surface:'var(--surface)', 'surface-2':'var(--surface-2)', 'surface-3':'var(--surface-3)',
  line:'var(--border)', 'line-strong':'var(--border-strong)', ink:'var(--text)', 'ink-2':'var(--text-2)', 'ink-3':'var(--text-3)',
  brand:'var(--brand-text)', 'brand-fill':'var(--primary-fill)', 'brand-fill-hover':'var(--primary-fill-hover)', 'brand-hover':'var(--primary-fill-hover)', 'on-brand':'var(--on-primary)', 'brand-tint':'var(--primary-tint)',
  pos:'var(--pos)', 'pos-fill':'var(--pos-fill)', 'pos-tint':'var(--pos-tint)', neg:'var(--neg)', 'neg-fill':'var(--neg-fill)', 'neg-tint':'var(--neg-tint)',
  warn:'var(--warn)', 'warn-tint':'var(--warn-tint)', info:'var(--info)', 'info-tint':'var(--info-tint)', ai:'var(--ai)', 'ai-tint':'var(--ai-tint)',
  neutral:'var(--neutral)', 'neutral-tint':'var(--neutral-tint)', 'gain-chart':'var(--pos-chart)', 'loss-chart':'var(--neg-chart)',
  risk:{ low:'var(--risk-low)', moderate:'var(--risk-moderate)', high:'var(--risk-high)', 'very-high':'var(--risk-very-high)' },
};
export default {
  content:["./index.html","./src/**/*.{js,ts,jsx,tsx}"], darkMode:'class',
  theme:{ extend:{ colors:{ ...semantic,
    dhru:{ bg:'var(--bg)',card:'var(--surface)',cardHover:'var(--surface-2)',border:'var(--border)',borderLight:'var(--border)',text:'var(--text)',muted:'var(--text-2)',cyan:'var(--primary)',blue:'var(--primary)',gain:'var(--pos)',loss:'var(--neg)',warning:'var(--warn)',purple:'var(--ai)' },
    fintrix:{ bg:'var(--bg)',bgSubtle:'var(--surface-2)',bgBlue:'var(--surface-2)',card:'var(--surface)',cardHover:'var(--surface-2)',border:'var(--border)',borderBlue:'var(--border)',text:'var(--text)',textMuted:'var(--text-2)',primary:'var(--primary)',primaryHover:'var(--primary-hover)',cyan:'var(--primary)',sky:'var(--info)',gain:'var(--pos)',gainBg:'var(--pos-tint)',loss:'var(--neg)',lossBg:'var(--neg-tint)',warning:'var(--warn)',warningBg:'var(--warn-tint)' }
  }, fontFamily:{ sans:['Geist','Inter','system-ui','-apple-system','sans-serif'],mono:['Geist','ui-monospace','SFMono-Regular','monospace'] }, boxShadow:{ card:'none','card-hover':'none',glass:'none' } } }, plugins:[]
};
