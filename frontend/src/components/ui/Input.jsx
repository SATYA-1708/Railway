import clsx from 'clsx';

export default function Input({ label, icon: Icon, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && <Icon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />}
        <input
          className={clsx(
            'w-full glass-input rounded-xl text-sm text-white placeholder-slate-500 outline-none',
            Icon ? 'pl-11 pr-3' : 'px-3.5',
            'py-2.5',
            className
          )}
          style={Icon ? { paddingLeft: '2.75rem' } : undefined}
          {...props}
        />
      </div>
    </div>
  );
}
