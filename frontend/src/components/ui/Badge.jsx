import clsx from 'clsx';

const VARIANTS = {
  success: 'bg-brand-500/12 text-brand-400 border-brand-500/30',
  warning: 'bg-amber-500/12 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/12 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/12 text-cyan-300 border-cyan-500/30',
  neutral: 'bg-slate-500/12 text-slate-300 border-slate-500/25',
};

const LIGHT_VARIANTS = {
  success: 'bg-[#e6f5ec] text-[#0d7a56] border-[#bfe3cf]',
  warning: 'bg-[#fdf3dd] text-[#9a6b0a] border-[#efd9a8]',
  danger: 'bg-[#fdeceb] text-[#b02a2a] border-[#f2c6c4]',
  info: 'bg-[#e9f1fa] text-[#1b56a0] border-[#c7dbf1]',
  neutral: 'bg-[#eef2f7] text-[#51678a] border-[#d9e2ed]',
};

export default function Badge({ variant = 'neutral', children, className, light = false, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        light ? LIGHT_VARIANTS[variant] || LIGHT_VARIANTS.neutral : `${VARIANTS[variant]} backdrop-blur-sm`,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
