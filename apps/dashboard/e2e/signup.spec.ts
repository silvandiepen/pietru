import { test, expect } from '@playwright/test';

const API = 'https://api.pietru.dev/v1';

// ── API Helpers ──────────────────────────────────────────────────

async function api(method: string, path: string, data?: unknown, cookie?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = `session=${cookie}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const setCookie = res.headers.get('set-cookie');
  const session = setCookie ? setCookie.match(/session=([^;]+)/)?.[1] ?? null : null;
  const ct = res.headers.get('content-type') ?? '';
  const body = ct.includes('json') ? await res.json() : await res.text();

  return { status: res.status, data: body, cookie: session };
}

async function waitForReceived(cookie: string, subjectContains: string, timeoutMs = 45_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await api('GET', '/messages?status=received&limit=50', undefined, cookie);
    if (r.status === 200 && r.data?.data?.items) {
      const msg = r.data.data.items.find(
        (m: { subject: string }) => m.subject.toLowerCase().includes(subjectContains.toLowerCase()),
      );
      if (msg) return msg;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timed out waiting for received email: "${subjectContains}"`);
}

async function extractVerifyToken(messageId: string, cookie: string) {
  const r = await api('GET', `/messages/${messageId}/raw`, undefined, cookie);
  if (r.status !== 200 || typeof r.data !== 'string') {
    throw new Error(`Raw email fetch failed: ${r.status}`);
  }
  const match = r.data.match(/verify-email\?token=([^\s"'&>\)]+)/);
  if (!match?.[1]) throw new Error('Token not found in raw email');
  return decodeURIComponent(match[1]);
}

async function extractResetToken(messageId: string, cookie: string) {
  const r = await api('GET', `/messages/${messageId}/raw`, undefined, cookie);
  if (r.status !== 200 || typeof r.data !== 'string') {
    throw new Error(`Raw email fetch failed: ${r.status}`);
  }
  const match = r.data.match(/reset-password\?token=([^\s"'&>\)]+)/);
  if (!match?.[1]) throw new Error('Reset token not found in raw email');
  return decodeURIComponent(match[1]);
}

// ── Setup (shared across all tests) ──────────────────────────────

const ts = Date.now();
const testEmail = `e2e-pw-${ts}@pietru.dev`;
const testPassword = 'E2ePlaywright!123';
let cookie: string | null = null;

test.beforeAll(async () => {
  const reg = await api('POST', '/auth/register', { email: testEmail, password: testPassword });
  if (reg.status !== 201) throw new Error(`Register failed: ${JSON.stringify(reg.data)}`);
  cookie = reg.cookie!;
  console.log(`\n  🔧 Registered: ${testEmail}`);
});

test.afterAll(async () => {
  if (cookie) {
    const r = await api('GET', '/projects', undefined, cookie);
    if (r.status === 200 && r.data?.data?.items) {
      for (const p of r.data.data.items) {
        await api('DELETE', `/projects/${p.id}`, undefined, cookie);
      }
    }
  }
});

// ── Signup + Email Verification ──────────────────────────────────

test.describe.serial('Signup + email verification (full flow)', () => {
  test('1. Verification email arrives via CF Email Routing', async () => {
    const msg = await waitForReceived(cookie!, 'Verify your email');
    expect(msg.status).toBe('received');
    expect(msg.from_address).toContain('no-reply@pietru.dev');
    console.log(`  ✅ Received: ${msg.id} — ${msg.subject}`);
  });

  test('2. Can fetch raw email and extract verification token', async () => {
    const msg = await waitForReceived(cookie!, 'Verify your email');
    const token = await extractVerifyToken(msg.id, cookie!);
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(10);
    console.log(`  ✅ Token: ${token.slice(0, 20)}...`);
  });

  test('3. Token verification succeeds via API', async () => {
    const msg = await waitForReceived(cookie!, 'Verify your email');
    const token = await extractVerifyToken(msg.id, cookie!);

    const r = await api('POST', '/auth/verify-email', { token });
    expect(r.status).toBe(200);
    expect(r.data.data.verifiedAt).toBeTruthy();
    console.log(`  ✅ Verified at: ${r.data.data.verifiedAt}`);
  });

  test('4. User shows as verified after verification', async () => {
    const r = await api('GET', '/auth/me', undefined, cookie!);
    expect(r.status).toBe(200);
    expect(r.data.data.email_verified_at).toBeTruthy();
    console.log(`  ✅ User verified: ${r.data.data.email_verified_at}`);
  });

  test('5. Dashboard login works after verification', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15_000 });
    await expect(page).toHaveURL(/\//);
    console.log(`  ✅ Dashboard loaded`);
  });

  test('6. Re-using the verification token fails', async () => {
    const msg = await waitForReceived(cookie!, 'Verify your email');
    const token = await extractVerifyToken(msg.id, cookie!);

    const r = await api('POST', '/auth/verify-email', { token });
    expect(r.status).toBe(400);
    expect(r.data.error.code).toBe('invalid_token');
    console.log(`  ✅ Reused token rejected`);
  });
});

// ── Password Reset ───────────────────────────────────────────────

test.describe.serial('Password reset flow', () => {
  test('1. Password reset email arrives via inbound', async () => {
    const r = await api('POST', '/auth/forgot-password', { email: testEmail }, cookie!);
    expect(r.status).toBe(200);

    const msg = await waitForReceived(cookie!, 'Reset your password');
    expect(msg.status).toBe('received');
    console.log(`  ✅ Reset email received: ${msg.id}`);
  });

  test('2. Can extract reset token and reset password', async () => {
    const msg = await waitForReceived(cookie!, 'Reset your password');
    const token = await extractResetToken(msg.id, cookie!);
    expect(token).toBeTruthy();
    console.log(`  ✅ Reset token: ${token.slice(0, 20)}...`);

    // Reset password
    const r = await api('POST', '/auth/reset-password', {
      token,
      password: 'E2ePlaywright!456',
    });
    expect(r.status).toBe(200);
    console.log(`  ✅ Password reset`);

    // Verify new password works
    const login = await api('POST', '/auth/login', { email: testEmail, password: 'E2ePlaywright!456' });
    expect(login.status).toBe(200);
    console.log(`  ✅ Login with new password`);
  });
});

// ── Inbound Address Management ───────────────────────────────────

test.describe.serial('Inbound address management', () => {
  let projId: string;

  test.beforeAll(async () => {
    const r = await api('POST', '/projects', { name: 'Inbound E2E' }, cookie!);
    projId = r.data.data.id;
  });

  test.afterAll(async () => {
    await api('DELETE', `/projects/${projId}`, undefined, cookie!);
  });

  test('CRUD: create, list, duplicate-reject, delete', async () => {
    // Create
    let r = await api('POST', `/projects/${projId}/inbound-addresses`, { userSlug: 'support' }, cookie!);
    expect(r.status).toBe(201);
    expect(r.data.data.email).toContain('support');
    const addrId = r.data.data.id;

    // Duplicate
    r = await api('POST', `/projects/${projId}/inbound-addresses`, { userSlug: 'support' }, cookie!);
    expect(r.status).toBe(409);

    // List
    r = await api('GET', `/projects/${projId}/inbound-addresses`, undefined, cookie!);
    expect(r.status).toBe(200);
    expect(r.data.data.length).toBe(1);

    // Delete
    r = await api('DELETE', `/projects/${projId}/inbound-addresses/${addrId}`, undefined, cookie!);
    expect(r.status).toBe(200);

    // Verify empty
    r = await api('GET', `/projects/${projId}/inbound-addresses`, undefined, cookie!);
    expect(r.data.data.length).toBe(0);
  });
});
