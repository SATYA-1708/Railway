import clsx from 'clsx';

export default function Input({ label, icon: Icon, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />}
        <input
          className={clsx(
            'w-full glass-input rounded-xl text-sm text-white placeholder-slate-500 outline-none',
            Icon ? 'pl-10 pr-3' : 'px-3.5',
            'py-2.5',
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
}
