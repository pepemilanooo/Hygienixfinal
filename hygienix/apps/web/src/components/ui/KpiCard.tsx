import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  delta?: string;
  deltaPositive?: boolean;
  subtitle?: string;
  className?: string;
}

export function KpiCard({ title, value, icon: Icon, iconColor = 'text-primary-700', iconBg = 'bg-primary-50', delta, deltaPositive, subtitle, className }: KpiCardProps) {
  return (
    <div className={cn('card p-5 card-hover', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {delta !== undefined && (
            <p className={cn('text-xs font-medium mt-2', deltaPositive !== false ? 'text-green-600' : 'text-red-500')}>
              {deltaPositive !== false ? '↑' : '↓'} {delta}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}
