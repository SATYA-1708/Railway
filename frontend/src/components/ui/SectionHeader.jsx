import clsx from 'clsx';

export default function SectionHeader({ icon: Icon, title, description, badge, iconColor = 'text-brand-400', className, light = false }) {
  return (
    <div className={clsx('flex items-start gap-3', className)}>
      {Icon && (
        <div className={clsx(
          'p-2 rounded-xl shrink-0',
          light
            ? 'bg-[#e9f1fa] border border-[#d3e2f4]'
            : 'glass-subtle border border-slate-700/80 glow-soft',
          iconColor
        )}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className={clsx('text-sm font-bold', light ? 'text-[#14253d]' : 'text-white')}>{title}</h3>
          {badge}
        </div>
        {description && <p className={clsx('text-xs mt-0.5', light ? 'text-[#6b7f99]' : 'text-slate-400')}>{description}</p>}
      </div>
    </div>
  );
}