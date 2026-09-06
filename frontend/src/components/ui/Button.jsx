import clsx from 'clsx';

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-500 to-cyan-400 text-slate-950 font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110',
  secondary:
    'bg-cyan-500/10 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/20 hover:border-cyan-300/60',
  ghost:
    'glass-subtle text-slate-200 hover:border-brand-500/40 hover:text-white',
  danger:
    'bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25 hover:text-red-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

export default function Button({ variant = 'primary', size = 'md', children, className, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
