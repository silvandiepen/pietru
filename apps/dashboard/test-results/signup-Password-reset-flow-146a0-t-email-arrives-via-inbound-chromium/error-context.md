# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup.spec.ts >> Password reset flow >> 1. Password reset email arrives via inbound
- Location: e2e/signup.spec.ts:144:3

# Error details

```
Error: Timed out waiting for received email: "Reset your password"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const API = 'https://api.pietru.dev/v1';
  4   | 
  5   | // ── API Helpers ──────────────────────────────────────────────────
  6   | 
  7   | async function api(method: string, path: string, data?: unknown, cookie?: string) {
  8   |   const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  9   |   if (cookie) headers['Cookie'] = `session=${cookie}`;
  10  | 
  11  |   const res = await fetch(`${API}${path}`, {
  12  |     method,
  13  |     headers,
  14  |     body: data ? JSON.stringify(data) : undefined,
  15  |   });
  16  | 
  17  |   const setCookie = res.headers.get('set-cookie');
  18  |   const session = setCookie ? setCookie.match(/session=([^;]+)/)?.[1] ?? null : null;
  19  |   const ct = res.headers.get('content-type') ?? '';
  20  |   const body = ct.includes('json') ? await res.json() : await res.text();
  21  | 
  22  |   return { status: res.status, data: body, cookie: session };
  23  | }
  24  | 
  25  | async function waitForReceived(cookie: string, subjectContains: string, timeoutMs = 45_000) {
  26  |   const start = Date.now();
  27  |   while (Date.now() - start < timeoutMs) {
  28  |     const r = await api('GET', '/messages?status=received&limit=50', undefined, cookie);
  29  |     if (r.status === 200 && r.data?.data?.items) {
  30  |       const msg = r.data.data.items.find(
  31  |         (m: { subject: string }) => m.subject.toLowerCase().includes(subjectContains.toLowerCase()),
  32  |       );
  33  |       if (msg) return msg;
  34  |     }
  35  |     await new Promise((r) => setTimeout(r, 3000));
  36  |   }
> 37  |   throw new Error(`Timed out waiting for received email: "${subjectContains}"`);
      |         ^ Error: Timed out waiting for received email: "Reset your password"
  38  | }
  39  | 
  40  | async function extractVerifyToken(messageId: string, cookie: string) {
  41  |   const r = await api('GET', `/messages/${messageId}/raw`, undefined, cookie);
  42  |   if (r.status !== 200 || typeof r.data !== 'string') {
  43  |     throw new Error(`Raw email fetch failed: ${r.status}`);
  44  |   }
  45  |   const match = r.data.match(/verify-email\?token=([^\s"'&>\)]+)/);
  46  |   if (!match?.[1]) throw new Error('Token not found in raw email');
  47  |   return decodeURIComponent(match[1]);
  48  | }
  49  | 
  50  | async function extractResetToken(messageId: string, cookie: string) {
  51  |   const r = await api('GET', `/messages/${messageId}/raw`, undefined, cookie);
  52  |   if (r.status !== 200 || typeof r.data !== 'string') {
  53  |     throw new Error(`Raw email fetch failed: ${r.status}`);
  54  |   }
  55  |   const match = r.data.match(/reset-password\?token=([^\s"'&>\)]+)/);
  56  |   if (!match?.[1]) throw new Error('Reset token not found in raw email');
  57  |   return decodeURIComponent(match[1]);
  58  | }
  59  | 
  60  | // ── Setup (shared across all tests) ──────────────────────────────
  61  | 
  62  | const ts = Date.now();
  63  | const testEmail = `e2e-pw-${ts}@pietru.dev`;
  64  | const testPassword = 'E2ePlaywright!123';
  65  | let cookie: string | null = null;
  66  | 
  67  | test.beforeAll(async () => {
  68  |   const reg = await api('POST', '/auth/register', { email: testEmail, password: testPassword });
  69  |   if (reg.status !== 201) throw new Error(`Register failed: ${JSON.stringify(reg.data)}`);
  70  |   cookie = reg.cookie!;
  71  |   console.log(`\n  🔧 Registered: ${testEmail}`);
  72  | });
  73  | 
  74  | test.afterAll(async () => {
  75  |   if (cookie) {
  76  |     const r = await api('GET', '/projects', undefined, cookie);
  77  |     if (r.status === 200 && r.data?.data?.items) {
  78  |       for (const p of r.data.data.items) {
  79  |         await api('DELETE', `/projects/${p.id}`, undefined, cookie);
  80  |       }
  81  |     }
  82  |   }
  83  | });
  84  | 
  85  | // ── Signup + Email Verification ──────────────────────────────────
  86  | 
  87  | test.describe.serial('Signup + email verification (full flow)', () => {
  88  |   test('1. Verification email arrives via CF Email Routing', async () => {
  89  |     const msg = await waitForReceived(cookie!, 'Verify your email');
  90  |     expect(msg.status).toBe('received');
  91  |     expect(msg.from_address).toContain('no-reply@pietru.dev');
  92  |     console.log(`  ✅ Received: ${msg.id} — ${msg.subject}`);
  93  |   });
  94  | 
  95  |   test('2. Can fetch raw email and extract verification token', async () => {
  96  |     const msg = await waitForReceived(cookie!, 'Verify your email');
  97  |     const token = await extractVerifyToken(msg.id, cookie!);
  98  |     expect(token).toBeTruthy();
  99  |     expect(token.length).toBeGreaterThan(10);
  100 |     console.log(`  ✅ Token: ${token.slice(0, 20)}...`);
  101 |   });
  102 | 
  103 |   test('3. Token verification succeeds via API', async () => {
  104 |     const msg = await waitForReceived(cookie!, 'Verify your email');
  105 |     const token = await extractVerifyToken(msg.id, cookie!);
  106 | 
  107 |     const r = await api('POST', '/auth/verify-email', { token });
  108 |     expect(r.status).toBe(200);
  109 |     expect(r.data.data.verifiedAt).toBeTruthy();
  110 |     console.log(`  ✅ Verified at: ${r.data.data.verifiedAt}`);
  111 |   });
  112 | 
  113 |   test('4. User shows as verified after verification', async () => {
  114 |     const r = await api('GET', '/auth/me', undefined, cookie!);
  115 |     expect(r.status).toBe(200);
  116 |     expect(r.data.data.email_verified_at).toBeTruthy();
  117 |     console.log(`  ✅ User verified: ${r.data.data.email_verified_at}`);
  118 |   });
  119 | 
  120 |   test('5. Dashboard login works after verification', async ({ page }) => {
  121 |     await page.goto('/login');
  122 |     await page.fill('input[type="email"]', testEmail);
  123 |     await page.fill('input[type="password"]', testPassword);
  124 |     await page.click('button[type="submit"]');
  125 |     await page.waitForURL('/', { timeout: 15_000 });
  126 |     await expect(page).toHaveURL(/\//);
  127 |     console.log(`  ✅ Dashboard loaded`);
  128 |   });
  129 | 
  130 |   test('6. Re-using the verification token fails', async () => {
  131 |     const msg = await waitForReceived(cookie!, 'Verify your email');
  132 |     const token = await extractVerifyToken(msg.id, cookie!);
  133 | 
  134 |     const r = await api('POST', '/auth/verify-email', { token });
  135 |     expect(r.status).toBe(400);
  136 |     expect(r.data.error.code).toBe('invalid_token');
  137 |     console.log(`  ✅ Reused token rejected`);
```