import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir, cpus, platform, release } from 'node:os';
import { join } from 'node:path';
import { createApi } from '../server/api.mjs';

// Sequential local HTTP benchmark; never uses the application's database.
const folder = await mkdtemp(join(tmpdir(), 'traveldiary-bench-'));
const server = createApi({ database: join(folder, 'benchmark.sqlite') });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
let token;
const results = [];
async function request(path, method = 'GET', body, expected = 200) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, expected);
  return data;
}
async function measure(name, operation, count = 50, warmup = 5) {
  for (let i = 0; i < warmup; i++) await operation();
  const samples = [];
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    await operation();
    samples.push(performance.now() - start);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const rounded = value => Number(value.toFixed(2));
  results.push({ name, count, warmup, medianMs: rounded(sorted[Math.ceil(count / 2) - 1]), p95Ms: rounded(sorted[Math.ceil(count * .95) - 1]), samplesMs: samples });
}
const draft = id => ({ id, title: 'ทริปทดสอบ', date: '2026-09-25', note: 'บันทึกการเดินทาง', location: { name: 'ขอนแก่น', latitude: 16.4, longitude: 102.8 }, photo: null, favorite: false });
try {
  const account = { email: 'benchmark@example.test', password: 'BenchmarkOnly123' };
  token = (await request('/auth/register', 'POST', account)).token;
  assert.ok(token);
  await measure('Login', async () => { assert.ok((await request('/auth/login', 'POST', account)).token); }, 10, 2);
  for (let i = 0; i < 100; i++) await request(`/trips/seed-${i}`, 'PUT', draft(`seed-${i}`), 201);
  await measure('List 100 trips (no photos)', async () => { assert.equal((await request('/trips')).length, 100); });
  await measure('Update one trip (no photo)', async () => { assert.equal((await request('/trips/seed-0', 'PUT', draft('seed-0'))).id, 'seed-0'); });
  let sequence = 0;
  await measure('Create one trip (no photo)', async () => { const id = `new-${sequence++}`; assert.equal((await request(`/trips/${id}`, 'PUT', draft(id), 201)).id, id); });
  let deletion = 0;
  await measure('Delete one trip', async () => { assert.equal((await request(`/trips/new-${deletion++}`, 'DELETE')).ok, true); });
  assert.equal((await request('/trips')).length, 100);
  const report = {
    measuredAt: new Date().toISOString(), node: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model,
    method: 'One sequential client; HTTP loopback; server and client in same Node process; temporary on-disk SQLite; 100 seeded trips without photos; timings include fetch and JSON parsing; nearest-rank percentiles; no mobile rendering or network latency measurement.',
    results,
  };
  await writeFile(new URL('../PERFORMANCE_RESULTS.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.table(results.map(({ samplesMs, ...summary }) => summary));
} finally {
  await new Promise(resolve => server.close(resolve));
  await rm(folder, { recursive: true });
}
