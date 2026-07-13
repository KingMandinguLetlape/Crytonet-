import { StatsCard } from '@/components/StatsCard';
import { Badge } from '@/components/Badge';
import { mockEvents, mockDecisions, mockIncidents } from '@/lib/mockData';

export default function OverviewPage() {
  const todayEvents = mockEvents.filter(
    (e) => new Date(e.timestamp) > new Date(Date.now() - 86_400_000),
  ).length;
  const activeIncidents = mockIncidents.filter((i) => i.status === 'open' || i.status === 'investigating').length;
  const blockedThreats = mockDecisions.filter((d) => d.action === 'block').length;
  const apiCalls = mockEvents.filter((e) => e.type === 'api_request').length;

  const recentEvents = mockEvents.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time threat intelligence powered by ORACODE
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Events Today"
          value={todayEvents.toString()}
          change="+12%"
          positive={false}
          icon="⚡"
        />
        <StatsCard
          title="Active Incidents"
          value={activeIncidents.toString()}
          change="-3"
          positive={true}
          icon="🚨"
        />
        <StatsCard
          title="Blocked Threats"
          value={blockedThreats.toString()}
          change="+8"
          positive={true}
          icon="🛡️"
        />
        <StatsCard
          title="API Calls"
          value={apiCalls.toLocaleString()}
          change="+4%"
          positive={true}
          icon="📡"
        />
      </div>

      {/* Recent Events */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Security Events</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{event.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500">{event.sourceIp}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={event.severity as 'low' | 'medium' | 'high' | 'critical'}>
                  {event.severity}
                </Badge>
                <span className="text-xs text-slate-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 px-6 py-3">
          <a href="/events" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all events →
          </a>
        </div>
      </div>

      {/* Active Incidents */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Active Incidents</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {mockIncidents
            .filter((i) => i.status !== 'closed' && i.status !== 'resolved')
            .slice(0, 3)
            .map((incident) => (
              <div key={incident.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{incident.title}</p>
                  <p className="text-xs text-slate-500">
                    Opened {new Date(incident.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={incident.severity as 'low' | 'medium' | 'high' | 'critical'}>
                    {incident.severity}
                  </Badge>
                  <Badge variant="status" status={incident.status}>
                    {incident.status}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
        <div className="border-t border-slate-200 px-6 py-3">
          <a href="/incidents" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all incidents →
          </a>
        </div>
      </div>
    </div>
  );
}
