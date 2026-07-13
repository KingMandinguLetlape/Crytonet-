import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { mockDecisions } from '@/lib/mockData';
import type { Column } from '@/components/DataTable';

export default function DecisionsPage() {
  const columns: Column<typeof mockDecisions[0]>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (v) => new Date(v as string).toLocaleString(),
    },
    { key: 'ruleId', header: 'Rule ID' },
    {
      key: 'action',
      header: 'Action',
      render: (v) => {
        const color = {
          block: 'critical',
          alert: 'high',
          throttle: 'medium',
          terminate: 'critical',
          allow: 'success',
        }[v as string] as 'critical' | 'high' | 'medium' | 'success';
        return <Badge variant={color}>{v as string}</Badge>;
      },
    },
    { key: 'reason', header: 'Reason' },
    { key: 'tenantId', header: 'Tenant' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rule Decisions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Decisions made by the ORACODE rule engine
        </p>
      </div>
      <DataTable data={mockDecisions} columns={columns} />
    </div>
  );
}
