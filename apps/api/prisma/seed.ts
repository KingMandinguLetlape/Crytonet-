import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashApiKey(rawKey: string): string {
  const salt = process.env.API_KEY_SALT ?? 'seed-salt';
  return crypto.createHmac('sha256', salt).update(rawKey).digest('hex');
}

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ─── Tenants ─────────────────────────────────────────────────────────────
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      id: 'tenant-demo-0001',
      name: 'Demo Corp',
      slug: 'demo',
      plan: 'starter',
      active: true,
    },
  });

  const enterpriseTenant = await prisma.tenant.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      id: 'tenant-ent-0001',
      name: 'Enterprise Inc',
      slug: 'enterprise',
      plan: 'enterprise',
      active: true,
    },
  });

  // ─── Users ────────────────────────────────────────────────────────────────
  const bcrypt = await import('bcryptjs');

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      id: uuidv4(),
      tenantId: demoTenant.id,
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('Admin1234!', 12),
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'analyst@demo.com' } },
    update: {},
    create: {
      id: uuidv4(),
      tenantId: demoTenant.id,
      email: 'analyst@demo.com',
      passwordHash: await bcrypt.hash('Analyst1234!', 12),
      role: 'analyst',
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: enterpriseTenant.id, email: 'admin@enterprise.com' } },
    update: {},
    create: {
      id: uuidv4(),
      tenantId: enterpriseTenant.id,
      email: 'admin@enterprise.com',
      passwordHash: await bcrypt.hash('EntAdmin1234!', 12),
      role: 'admin',
    },
  });

  // ─── API Keys ─────────────────────────────────────────────────────────────
  const demoRawKey = 'ck_demo_0000000000000000000000000000000000000000000000000000000000000001';
  const entRawKey = 'ck_ent_00000000000000000000000000000000000000000000000000000000000000002';

  await prisma.apiKey.upsert({
    where: { keyHash: hashApiKey(demoRawKey) },
    update: {},
    create: {
      id: uuidv4(),
      tenantId: demoTenant.id,
      name: 'Demo Default Key',
      keyHash: hashApiKey(demoRawKey),
    },
  });

  await prisma.apiKey.upsert({
    where: { keyHash: hashApiKey(entRawKey) },
    update: {},
    create: {
      id: uuidv4(),
      tenantId: enterpriseTenant.id,
      name: 'Enterprise Default Key',
      keyHash: hashApiKey(entRawKey),
    },
  });

  // ─── Sample Security Events ───────────────────────────────────────────────
  const eventIds = Array.from({ length: 10 }, () => uuidv4());
  const eventTypes = [
    'login_failed', 'login_success', 'api_request', 'data_download',
    'privilege_access', 'session_activity', 'login_failed',
    'login_failed', 'api_request', 'login_failed',
  ];
  const severities = ['low', 'medium', 'high', 'critical', 'high', 'medium', 'high', 'high', 'low', 'critical'];
  const ips = ['192.168.1.1', '10.0.0.5', '203.0.113.1', '198.51.100.2', '192.168.1.1',
    '10.0.0.10', '203.0.113.1', '203.0.113.1', '172.16.0.1', '203.0.113.1'];

  for (let i = 0; i < 10; i++) {
    await prisma.securityEvent.upsert({
      where: { id: eventIds[i] },
      update: {},
      create: {
        id: eventIds[i],
        tenantId: demoTenant.id,
        type: eventTypes[i],
        severity: severities[i],
        sourceIp: ips[i],
        userId: adminUser.id,
        metadata: { country: i % 2 === 0 ? 'US' : 'CN', bytes: 50 * 1024 * 1024 },
        timestamp: new Date(Date.now() - i * 60_000),
        processed: true,
      },
    });
  }

  // ─── Sample Decisions ─────────────────────────────────────────────────────
  await prisma.decision.create({
    data: {
      id: uuidv4(),
      tenantId: demoTenant.id,
      eventId: eventIds[0],
      ruleId: 'RULE_001',
      action: 'block',
      reason: 'Brute force detected: 6 failed logins from 203.0.113.1 in 5 minutes',
      metadata: { failedAttempts: 6, sourceIp: '203.0.113.1' },
    },
  });

  await prisma.decision.create({
    data: {
      id: uuidv4(),
      tenantId: demoTenant.id,
      eventId: eventIds[2],
      ruleId: 'RULE_005',
      action: 'throttle',
      reason: 'Anomalous API usage: 1250 requests in the last minute',
      metadata: { requestCount: 1250, threshold: 1000 },
    },
  });

  // ─── Sample Incident ──────────────────────────────────────────────────────
  await prisma.incident.create({
    data: {
      id: uuidv4(),
      tenantId: demoTenant.id,
      title: 'Brute Force Attack from 203.0.113.1',
      severity: 'high',
      status: 'investigating',
      assigneeId: adminUser.id,
    },
  });

  console.log('✅ Seed complete');
  console.log(`   Demo API key: ${demoRawKey}`);
  console.log(`   Enterprise API key: ${entRawKey}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
