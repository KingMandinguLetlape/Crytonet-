import { Worker, Job, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { SecurityEventPayload } from '@crytonet/shared';
import { evaluateEvent } from './ruleEngine';

const prisma = new PrismaClient();

function getRedisConnectionOptions() {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
      ...(parsed.username && parsed.username !== 'default' ? { username: decodeURIComponent(parsed.username) } : {}),
      maxRetriesPerRequest: null as null,
    };
  } catch {
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null as null };
  }
}

// ─── Job payload ──────────────────────────────────────────────────────────
interface EvaluateJobData {
  eventId: string;
  tenantId: string;
}

// ─── Main processor ───────────────────────────────────────────────────────
async function processEvent(job: Job<EvaluateJobData>): Promise<void> {
  const { eventId, tenantId } = job.data;
  console.log(`[worker] Processing event ${eventId} for tenant ${tenantId}`);

  const dbEvent = await prisma.securityEvent.findUnique({ where: { id: eventId } });
  if (!dbEvent) {
    console.warn(`[worker] Event ${eventId} not found, skipping`);
    return;
  }

  // Build SecurityEventPayload
  const event: SecurityEventPayload = {
    tenantId: dbEvent.tenantId,
    type: dbEvent.type as SecurityEventPayload['type'],
    severity: dbEvent.severity as SecurityEventPayload['severity'],
    sourceIp: dbEvent.sourceIp,
    userId: dbEvent.userId ?? undefined,
    metadata: (dbEvent.metadata as Record<string, unknown>) ?? {},
    timestamp: dbEvent.timestamp.toISOString(),
  };

  // Fetch recent events for context (last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000);
  const recentDbEvents = await prisma.securityEvent.findMany({
    where: {
      tenantId,
      timestamp: { gte: tenMinutesAgo },
      id: { not: eventId },
    },
    orderBy: { timestamp: 'desc' },
    take: 500,
  });

  const recentEvents: SecurityEventPayload[] = recentDbEvents.map((e) => ({
    tenantId: e.tenantId,
    type: e.type as SecurityEventPayload['type'],
    severity: e.severity as SecurityEventPayload['severity'],
    sourceIp: e.sourceIp,
    userId: e.userId ?? undefined,
    metadata: (e.metadata as Record<string, unknown>) ?? {},
    timestamp: e.timestamp.toISOString(),
  }));

  const decisions = evaluateEvent(event, eventId, {
    recentEvents,
    now: new Date(),
  });

  if (decisions.length > 0) {
    await prisma.$transaction([
      // Insert decisions
      ...decisions.map((d) =>
        prisma.decision.create({
          data: {
            id: uuidv4(),
            tenantId: d.tenantId,
            eventId: d.eventId,
            ruleId: d.ruleId,
            action: d.action,
            reason: d.reason,
            metadata: d.metadata as Record<string, string | number | boolean | null>,
            timestamp: new Date(d.timestamp),
          },
        }),
      ),
      // Append to audit trail
      ...decisions.map((d) =>
        prisma.auditLog.create({
          data: {
            id: uuidv4(),
            tenantId: d.tenantId,
            actorId: 'system',
            actorType: 'system',
            action: `RULE_TRIGGERED:${d.ruleId}:${d.action}`,
            resourceType: 'SecurityEvent',
            resourceId: d.eventId,
            metadata: { ruleId: d.ruleId, action: d.action, reason: d.reason },
          },
        }),
      ),
    ]);
    console.log(`[worker] Saved ${decisions.length} decision(s) for event ${eventId}`);
  }

  // Mark event as processed
  await prisma.securityEvent.update({
    where: { id: eventId },
    data: { processed: true },
  });
}

// ─── Dead letter queue ────────────────────────────────────────────────────
async function handleFailed(job: Job<EvaluateJobData>, err: Error): Promise<void> {
  console.error(`[worker] Job ${job.id} failed permanently:`, err.message);
  const dlq = new Queue('security-events:dlq', { connection: getRedisConnectionOptions() });
  await dlq.add('failed', { ...job.data, error: err.message, failedAt: new Date().toISOString() });
  await dlq.close();
}

// ─── Start worker ─────────────────────────────────────────────────────────
export async function startWorker(): Promise<Worker<EvaluateJobData>> {
  const worker = new Worker<EvaluateJobData>(
    'security-events',
    processEvent,
    {
      connection: getRedisConnectionOptions(),
      concurrency: 10,
      limiter: { max: 500, duration: 1000 },
    },
  );

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      handleFailed(job, err).catch(console.error);
    } else {
      console.warn(`[worker] Job ${job?.id} attempt ${job?.attemptsMade} failed:`, err.message);
    }
  });

  worker.on('error', (err) => {
    console.error('[worker] Worker error:', err);
  });

  console.log('[worker] BullMQ worker started on queue: security-events');

  process.on('SIGTERM', async () => {
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  return worker;
}
