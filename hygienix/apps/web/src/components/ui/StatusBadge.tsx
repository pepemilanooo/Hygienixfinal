import { cn } from '@/lib/utils';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils';

type Variant = 'status' | 'priority' | 'clientStatus' | 'siteStatus' | 'outcome';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-primary-100 text-primary-800',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const OUTCOME_COLORS: Record<string, string> = {
  OK: 'bg-green-100 text-green-700',
  ATTENTION: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
  NOT_CHECKED: 'bg-gray-100 text-gray-500',
  INACTIVE: 'bg-gray-100 text-gray-400',
};

interface StatusBadgeProps {
  value: string;
  variant?: Variant;
  className?: string;
}

export function StatusBadge({ value, variant = 'status', className }: StatusBadgeProps) {
  let colorClass = '';
  let label = value;

  if (variant === 'status') {
    colorClass = STATUS_COLORS[value] || 'bg-gray-100 text-gray-600';
    label = STATUS_LABELS[value] || value;
  } else if (variant === 'priority') {
    colorClass = PRIORITY_COLORS[value] || 'bg-gray-100 text-gray-600';
    label = PRIORITY_LABELS[value] || value;
  } else if (variant === 'outcome') {
    colorClass = OUTCOME_COLORS[value] || 'bg-gray-100 text-gray-600';
    const OUTCOME_LABELS: Record<string, string> = { OK: 'OK', ATTENTION: 'Attenzione', CRITICAL: 'Critico', NOT_CHECKED: 'Non controllato', INACTIVE: 'Inattivo' };
    label = OUTCOME_LABELS[value] || value;
  }

  return (
    <span className={cn('badge font-medium', colorClass, className)}>
      {label}
    </span>
  );
}
