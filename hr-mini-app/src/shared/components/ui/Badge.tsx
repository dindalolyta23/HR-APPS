import type { ReactNode } from 'react';
import { cn } from '@shared/utils/cn';
import type { AttendanceStatus } from '@shared/types';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'present'
  | 'late'
  | 'absent'
  | 'leave';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  present: 'badge-present',
  late: 'badge-late',
  absent: 'badge-absent',
  leave: 'badge-leave',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  present: 'bg-[var(--color-status-present)]',
  late: 'bg-[var(--color-status-late)]',
  absent: 'bg-[var(--color-status-absent)]',
  leave: 'bg-[var(--color-status-leave)]',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * Convenience component for attendance status badges.
 */
export function AttendanceStatusBadge({
  status,
  size = 'sm',
}: {
  status: AttendanceStatus;
  size?: BadgeSize;
}) {
  const labels: Record<AttendanceStatus, string> = {
    present: 'Hadir',
    late: 'Terlambat',
    absent: 'Tidak Hadir',
    leave: 'Izin',
  };

  const variants: Record<AttendanceStatus, BadgeVariant> = {
    present: 'present',
    late: 'late',
    absent: 'absent',
    leave: 'leave',
  };

  return (
    <Badge variant={variants[status]} size={size} dot>
      {labels[status]}
    </Badge>
  );
}
