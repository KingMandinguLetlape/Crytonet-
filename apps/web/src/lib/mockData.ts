// Mock data for the dashboard skeleton (no backend required)

export const mockEvents = [
  { id: 'evt-001', tenantId: 'tenant-demo', type: 'login_failed', severity: 'high', sourceIp: '203.0.113.1', userId: 'user-alice', metadata: { country: 'CN' }, timestamp: new Date(Date.now() - 2 * 60_000).toISOString(), processed: true },
  { id: 'evt-002', tenantId: 'tenant-demo', type: 'api_request', severity: 'low', sourceIp: '10.0.0.5', userId: 'user-bob', metadata: {}, timestamp: new Date(Date.now() - 5 * 60_000).toISOString(), processed: true },
  { id: 'evt-003', tenantId: 'tenant-demo', type: 'data_download', severity: 'critical', sourceIp: '192.168.1.10', userId: 'user-carol', metadata: { bytes: 120_000_000 }, timestamp: new Date(Date.now() - 8 * 60_000).toISOString(), processed: true },
  { id: 'evt-004', tenantId: 'tenant-demo', type: 'privilege_access', severity: 'critical', sourceIp: '172.16.0.1', userId: 'user-dave', metadata: { role: 'analyst', endpoint: '/admin/users' }, timestamp: new Date(Date.now() - 12 * 60_000).toISOString(), processed: false },
  { id: 'evt-005', tenantId: 'tenant-demo', type: 'login_failed', severity: 'high', sourceIp: '203.0.113.1', userId: 'user-eve', metadata: { country: 'RU' }, timestamp: new Date(Date.now() - 15 * 60_000).toISOString(), processed: true },
  { id: 'evt-006', tenantId: 'tenant-demo', type: 'session_activity', severity: 'medium', sourceIp: '55.55.55.55', userId: 'user-alice', metadata: { sessionId: 'sess-001', userAgent: 'curl/7.88' }, timestamp: new Date(Date.now() - 20 * 60_000).toISOString(), processed: true },
  { id: 'evt-007', tenantId: 'tenant-demo', type: 'login_success', severity: 'low', sourceIp: '10.0.0.5', userId: 'user-frank', metadata: { country: 'US' }, timestamp: new Date(Date.now() - 25 * 60_000).toISOString(), processed: true },
  { id: 'evt-008', tenantId: 'tenant-demo', type: 'api_request', severity: 'low', sourceIp: '10.0.0.6', userId: null, metadata: {}, timestamp: new Date(Date.now() - 30 * 60_000).toISOString(), processed: true },
] as const;

export const mockDecisions = [
  { id: 'dec-001', ruleId: 'RULE_001', eventId: 'evt-001', tenantId: 'tenant-demo', action: 'block', reason: 'Brute force detected: 6 failed logins from 203.0.113.1 in 5 minutes', metadata: {}, timestamp: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: 'dec-002', ruleId: 'RULE_003', eventId: 'evt-004', tenantId: 'tenant-demo', action: 'block', reason: 'Privilege escalation: role "analyst" attempted to access /admin/users', metadata: {}, timestamp: new Date(Date.now() - 12 * 60_000).toISOString() },
  { id: 'dec-003', ruleId: 'RULE_004', eventId: 'evt-003', tenantId: 'tenant-demo', action: 'alert', reason: 'Data exfiltration: 114.4 MB downloaded in 10 minutes', metadata: {}, timestamp: new Date(Date.now() - 8 * 60_000).toISOString() },
  { id: 'dec-004', ruleId: 'RULE_007', eventId: 'evt-006', tenantId: 'tenant-demo', action: 'terminate', reason: 'Session hijacking: sess-001 used from different IP', metadata: {}, timestamp: new Date(Date.now() - 20 * 60_000).toISOString() },
] as const;

export const mockRules = [
  { id: 'RULE_001', name: 'Brute Force Detection', description: 'Blocks when >5 failed logins from the same IP within 5 minutes.', severity: 'high', action: 'block', enabled: true },
  { id: 'RULE_002', name: 'Impossible Travel', description: 'Alerts when a user logs in from 2 different countries within 1 hour.', severity: 'high', action: 'alert', enabled: true },
  { id: 'RULE_003', name: 'Privilege Escalation', description: 'Blocks non-admin roles accessing admin endpoints.', severity: 'critical', action: 'block', enabled: true },
  { id: 'RULE_004', name: 'Data Exfiltration', description: 'Alerts when a user downloads >100 MB within 10 minutes.', severity: 'critical', action: 'alert', enabled: true },
  { id: 'RULE_005', name: 'Anomalous API Usage', description: 'Throttles tenants making >1000 API requests per minute.', severity: 'medium', action: 'throttle', enabled: true },
  { id: 'RULE_006', name: 'Credential Stuffing', description: 'Blocks when >20 unique user attempts from same IP in 5 minutes.', severity: 'critical', action: 'block', enabled: true },
  { id: 'RULE_007', name: 'Session Hijacking', description: 'Terminates sessions used from a different IP or User-Agent mid-session.', severity: 'critical', action: 'terminate', enabled: true },
] as const;

export const mockIncidents = [
  { id: 'inc-001', tenantId: 'tenant-demo', title: 'Brute Force Attack from 203.0.113.1', severity: 'high', status: 'investigating', assigneeId: 'user-admin', createdAt: new Date(Date.now() - 60 * 60_000).toISOString(), resolvedAt: null },
  { id: 'inc-002', tenantId: 'tenant-demo', title: 'Data Exfiltration by user-carol', severity: 'critical', status: 'open', assigneeId: null, createdAt: new Date(Date.now() - 30 * 60_000).toISOString(), resolvedAt: null },
  { id: 'inc-003', tenantId: 'tenant-demo', title: 'Privilege Escalation Attempt', severity: 'critical', status: 'open', assigneeId: 'user-admin', createdAt: new Date(Date.now() - 20 * 60_000).toISOString(), resolvedAt: null },
  { id: 'inc-004', tenantId: 'tenant-demo', title: 'Session Hijacking - sess-001', severity: 'critical', status: 'resolved', assigneeId: 'user-admin', createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(), resolvedAt: new Date(Date.now() - 1 * 3600_000).toISOString() },
  { id: 'inc-005', tenantId: 'tenant-demo', title: 'Credential Stuffing from 9.9.9.9', severity: 'high', status: 'closed', assigneeId: 'user-admin', createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(), resolvedAt: new Date(Date.now() - 20 * 3600_000).toISOString() },
] as const;
