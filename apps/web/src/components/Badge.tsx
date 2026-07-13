import React from 'react';

type BadgeVariant = 'low' | 'medium' | 'high' | 'critical' | 'success' | 'pending' | 'status';

interface BadgeProps {
  variant: BadgeVariant;
  status?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  success: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-slate-100 text-slate-500',
};

const STATUS_CLASSES: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

export function Badge({ variant, status, children }: BadgeProps) {
  const classes =
    variant === 'status' && status
      ? (STATUS_CLASSES[status] ?? 'bg-slate-100 text-slate-500')
      : (VARIANT_CLASSES[variant] ?? 'bg-slate-100 text-slate-700');

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
      {children}
    </span>
  );
}
