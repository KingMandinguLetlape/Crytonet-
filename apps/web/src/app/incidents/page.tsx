import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { mockIncidents } from '@/lib/mockData';
import type { Column } from '@/components/DataTable';

export default function IncidentsPage() {
  const columns: Column<typeof mockIncidents[0]>[] = [
    { key: 'id', header: 'ID', render: (v) => <span className="font-mono text-xs">{(v as string).slice(0, 8)}</span> },
    { key: 'title', header: 'Title', render: (v) => <span className="font-medium text-slate-900">{v as string}</span> },
    {
      key: 'severity',
      header: 'Severity',
      render: (v) => <Badge variant={v as 'low' | 'medium' | 'high' | 'critical'}>{v as string}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <Badge variant="status" status={v as string}>{v as string}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (v) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: 'resolvedAt',
      header: 'Resolved',
      render: (v) => v ? new Date(v as string).toLocaleDateString() : '—',
    },
  ];

  const open = mockIncidents.filter((i) => i.status === 'open').length;
  const investigating = mockIncidents.filter((i) => i.status === 'investigating').length;
  const resolved = mockIncidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Incidents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and manage security incidents
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', count: open, color: 'text-red-600 bg-red-50' },
          { label: 'Investigating', count: investigating, color: 'text-amber-600 bg-amber-50' },
          { label: 'Resolved', count: resolved, color: 'text-emerald-600 bg-emerald-50' },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{count}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <DataTable data={mockIncidents} columns={columns} />
    </div>
  );
}
