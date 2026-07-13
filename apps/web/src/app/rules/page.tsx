import { mockRules } from '@/lib/mockData';
import { Badge } from '@/components/Badge';

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ORACODE Rules</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage and monitor the ORACODE threat detection rule engine
        </p>
      </div>

      <div className="grid gap-4">
        {mockRules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-mono text-sm font-bold">
                {rule.id.replace('RULE_', '')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{rule.name}</h3>
                  <span className="font-mono text-xs text-slate-400">{rule.id}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{rule.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={rule.severity as 'low' | 'medium' | 'high' | 'critical'}>
                    {rule.severity}
                  </Badge>
                  <Badge
                    variant={
                      rule.action === 'block' || rule.action === 'terminate'
                        ? 'critical'
                        : rule.action === 'alert'
                          ? 'high'
                          : 'medium'
                    }
                  >
                    {rule.action}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${rule.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </span>
              {/* Toggle */}
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  rule.enabled ? 'bg-brand-600' : 'bg-slate-200'
                }`}
                aria-label={`Toggle ${rule.name}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    rule.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
