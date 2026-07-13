import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { mockEvents } from '@/lib/mockData';
import type { Column } from '@/components/DataTable';

export default function EventsPage() {
  const columns: Column<typeof mockEvents[0]>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (v) => new Date(v as string).toLocaleString(),
    },
    {
      key: 'type',
      header: 'Type',
      render: (v) => (
        <span className="font-medium text-slate-900">{(v as string).replace(/_/g, ' ')}</span>
      ),
    },
    { key: 'sourceIp', header: 'Source IP' },
    { key: 'userId', header: 'User ID', render: (v) => (v as string | null) ?? '—' },
    {
      key: 'severity',
      header: 'Severity',
      render: (v) => (
        <Badge variant={v as 'low' | 'medium' | 'high' | 'critical'}>{v as string}</Badge>
      ),
    },
    {
      key: 'processed',
      header: 'Status',
      render: (v) => (
        <Badge variant={v ? 'success' : 'pending'}>{v ? 'Processed' : 'Pending'}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security Events</h1>
          <p className="mt-1 text-sm text-slate-500">
            All incoming security events ingested by CRYTONET
          </p>
        </div>
        <div className="flex gap-3">
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <option value="">All Types</option>
            <option value="login_failed">Login Failed</option>
            <option value="login_success">Login Success</option>
            <option value="api_request">API Request</option>
            <option value="data_download">Data Download</option>
          </select>
        </div>
      </div>
      <DataTable data={mockEvents} columns={columns} />
    </div>
  );
}
