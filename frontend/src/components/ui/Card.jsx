import clsx from 'clsx';

const ACCENT_EDGE = {
  emerald: 'before:bg-gradient-to-b before:from-brand-500 before:to-cyan-400',
  cyan: 'before:bg-gradient-to-b before:from-cyan-400 before:to-blue-500',
  amber: 'before:bg-gradient-to-b before:from-amber-400 before:to-orange-500',
  red: 'before:bg-gradient-to-b before:from-red-400 before:to-rose-600',
  blue: 'before:bg-gradient-to-b before:from-blue-400 before:to-indigo-500',
};

const LIGHT_ACCENT_EDGE = {
  emerald: '#0d7a56',
  cyan: '#0b7da8',
  amber: '#b45309',
  red: '#b02a2a',
  blue: '#1b56a0',
};

export default function Card({ children, className, accent, padded = true, style, light = false, ...props }) {
  return (
    <div
      style={{ padding: padded ? '1.5rem' : '0', ...style }}
      className={clsx(
        'relative rounded-2xl transition-all',
        light
          ? 'bg-white border border-[#d8e2ee] shadow-[0_1px_2px_rgba(24,46,82,0.05),0_10px_28px_-20px_rgba(24,46,82,0.4)]'
          : 'glass-panel',
        light && accent
          ? { borderLeft: `3px solid ${LIGHT_ACCENT_EDGE[accent] || LIGHT_ACCENT_EDGE.emerald}` }
          : accent &&
            `before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:content-[''] ${ACCENT_EDGE[accent] || ACCENT_EDGE.emerald}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}