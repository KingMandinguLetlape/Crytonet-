interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

export function StatsCard({ title, value, change, positive, icon }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p
        className={`mt-1 text-xs font-medium ${
          positive ? 'text-emerald-600' : 'text-red-500'
        }`}
      >
        {change} vs last period
      </p>
    </div>
  );
}
