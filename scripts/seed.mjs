/**
 * Seed job-hunt-api with fake applications so pagination / filters / search can
 * be exercised in the running app.
 *
 *   node scripts/seed.mjs
 *
 * Env (all optional):
 *   SEED_API_URL   default: VITE_API_URL from .env, else http://localhost:3001
 *   SEED_EMAIL     default: demo@example.com
 *   SEED_PASSWORD  default: demopassword
 *   SEED_COUNT     default: 30
 *
 * The target account is created if it doesn't exist. Its existing applications
 * are deleted first, so re-running always leaves exactly SEED_COUNT.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function apiUrlFromEnvFile() {
  try {
    const env = readFileSync(join(root, '.env'), 'utf8');
    const match = env.match(/^VITE_API_URL=(.+)$/m);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const API_URL = process.env.SEED_API_URL ?? apiUrlFromEnvFile() ?? 'http://localhost:3001';
const EMAIL = process.env.SEED_EMAIL ?? 'demo@example.com';
const PASSWORD = process.env.SEED_PASSWORD ?? 'demopassword';
const COUNT = Number(process.env.SEED_COUNT ?? 30);

const STATUSES = [
  'wishlist',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'accepted',
];
const COMPANIES = [
  'Stripe',
  'Intercom',
  'HubSpot',
  'Workday',
  'Fenergo',
  'Wayflyer',
  'Flipdish',
  'LetsGetChecked',
  'Tines',
  'Datadog',
  'Squarespace',
  'Personio',
  'Udemy',
  'Cubic Telecom',
  'Ocuco',
  'Nostra',
  'SoftIron',
  'Zalando',
  'Klarna',
  'Toast',
];
const ROLES = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full-Stack Engineer',
  'Senior Frontend Engineer',
  'Staff Engineer',
  'Platform Engineer',
  'Site Reliability Engineer',
  'DevOps Engineer',
  'Engineering Manager',
  'Tech Lead',
  'React Developer',
  'TypeScript Engineer',
];
const LOCATIONS = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Remote'];

function pick(list, i) {
  return list[i % list.length];
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function buildApplication(i) {
  const status = STATUSES[i % STATUSES.length];
  const salaryMin = 60000 + (i % 8) * 7500;
  const hasSalary = i % 4 !== 0;
  return {
    company: pick(COMPANIES, i),
    role: pick(ROLES, i * 3 + (i % 5)),
    status,
    location: pick(LOCATIONS, i * 2),
    jobUrl: `https://jobs.example.com/${pick(COMPANIES, i).toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
    salaryMin: hasSalary ? salaryMin : null,
    salaryMax: hasSalary ? salaryMin + 25000 : null,
    salaryCurrency: hasSalary ? 'EUR' : null,
    notes: i % 3 === 0 ? `Referred by a contact • round ${(i % 4) + 1}` : null,
    // wishlist entries haven't been applied to yet
    appliedAt: status === 'wishlist' ? null : daysAgoIso((i * 5) % 90),
  };
}

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  return res;
}

async function getToken() {
  const login = () =>
    api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

  let res = await login();
  if (res.status === 401) {
    console.log(`Account ${EMAIL} not found — registering it.`);
    const reg = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!reg.ok) throw new Error(`register failed: ${reg.status} ${await reg.text()}`);
    res = await login();
  }
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  const { accessToken } = await res.json();
  return accessToken;
}

async function clearExisting(token) {
  const auth = { Authorization: `Bearer ${token}` };
  const res = await api('/applications?pageSize=100', { headers: auth });
  if (!res.ok) throw new Error(`list failed: ${res.status}`);
  const { data } = await res.json();
  for (const app of data) {
    await api(`/applications/${app.id}`, { method: 'DELETE', headers: auth });
  }
  return data.length;
}

async function main() {
  console.log(`API:     ${API_URL}`);
  console.log(`Account: ${EMAIL}`);

  const token = await getToken();
  const removed = await clearExisting(token);
  if (removed) console.log(`Cleared ${removed} existing application(s).`);

  const auth = { Authorization: `Bearer ${token}` };
  let created = 0;
  for (let i = 0; i < COUNT; i += 1) {
    const res = await api('/applications', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(buildApplication(i)),
    });
    if (!res.ok) {
      console.error(`  ✗ ${i + 1}: ${res.status} ${await res.text()}`);
      continue;
    }
    created += 1;
  }

  console.log(`\n✓ Seeded ${created} application(s).`);
  console.log(`Log in to the app as ${EMAIL} / ${PASSWORD} to see them.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
