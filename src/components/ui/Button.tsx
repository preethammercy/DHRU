import React from 'react';

export type ButtonVariant =
  | 'trade'
  | 'buy'
  | 'sell'
  | 'autoTrade'
  | 'confirm'
  | 'analyze'
  | 'refresh'
  | 'secondary'
  | 'destructive'
  | 'export';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  // Trade in Terminal: vivid blue gradient, white text, blue glow on hover
  trade:
    'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border border-blue-400/80 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 focus:ring-blue-500',
  
  // Buy / Long: green, white text
  buy:
    'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/80 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/40 focus:ring-emerald-500',
  
  // Sell / Short: red, white text
  sell:
    'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/80 shadow-md shadow-rose-600/25 hover:shadow-lg hover:shadow-rose-600/40 focus:ring-rose-500',
  
  // Start Fully Automatic DHRU Auto Trade: BLACK button with 1px bright border (#38BDF8 / #FACC15) & shine sweep
  autoTrade:
    'relative overflow-hidden bg-[#0A0A0A] hover:bg-black text-white border border-[#38BDF8] shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/40 focus:ring-sky-400 group',
  
  // Confirm / Execute: purple, white text
  confirm:
    'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/80 shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/40 focus:ring-purple-500',
  
  // Run AI / Analyze: teal, white text
  analyze:
    'bg-teal-600 hover:bg-teal-500 text-white border border-teal-400/80 shadow-md shadow-teal-600/25 hover:shadow-lg hover:shadow-teal-600/40 focus:ring-teal-500',
  
  // Refresh: amber, dark text
  refresh:
    'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border border-amber-400 shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/40 focus:ring-amber-500',
  
  // Secondary / Cancel: slate border on subtle background
  secondary:
    'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-600 shadow-sm hover:border-slate-500 focus:ring-slate-400',
  
  // Destructive (Close All / Reset): deep rose / crimson
  destructive:
    'bg-rose-700 hover:bg-rose-600 text-white border border-rose-600 shadow-md shadow-rose-700/25 hover:shadow-lg hover:shadow-rose-700/40 focus:ring-rose-600',
  
  // Export / Report: indigo
  export:
    'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/80 shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/40 focus:ring-indigo-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-sm sm:text-base rounded-xl gap-2.5',
  icon: 'p-2 text-sm rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {/* Shine sweep effect for autoTrade variant */}
        {variant === 'autoTrade' && (
          <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
        )}
        {loading ? (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
