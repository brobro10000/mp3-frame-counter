# Retained diagnostic source, inert review text

These fences are historical source, not new runnable entrypoints or instructions to execute them. The files ran only in
disposable Linux diagnostics. No application implementation is embedded. Absolute paths below are fixed container paths
(`/probe`, `/proc`, `/harness`, `/usr`), not personal host paths. No certificate, private key or token value is
included. `CONTROL_TOKEN` is the synthetic test-only symbol; it is not a provider credential.

## Actual TLS probe

Original `.artifacts/hosted-linux-full/run.mjs`, SHA-256
`15007bcc112e478a4ca72f0de5891d408d729c92c661cd473d81bc6be724add4`. The fenced source is byte-identical to that
original. It uses normal TLS before and after an ephemeral CA is trusted, compares exact body hashes and duplicate
CSP/header values, checks the foreign receiver counters, and closes owned resources. Trust is changed only inside the
disposable container; successful results do not prove provider identity.

```text
/**
 * Root-owned isolated Linux calibration of the actual candidate browser and HTTP adapters. Run only in the prepared
 * credential-free --network none image with this evidence directory mounted. Synthetic loopback credentials only.
 * Creates a disposable certificate trust store inside the ephemeral container, never disables TLS/CSP checks, records
 * only closed scalar observations and hashes, and cleans browser/listeners/temp keys. No product/provider acceptance.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:https';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {homedir,tmpdir} from 'node:os';
import tls from 'node:tls';
import {chromium} from '/harness/node_modules/playwright/index.mjs';
import {runHostedBrowserControls} from './suite/lib/hosted-browser-controls.ts';
import {openHostedBrowser} from './suite/lib/hosted-browser.ts';
import {createOwnedControlTarget,CONTROL_TOKEN} from './suite/lib/hosted-control-target.ts';
import {createHostedHttp} from './suite/lib/hosted-http.ts';
const hash=b=>createHash('sha256').update(b).digest('hex');
const dir=mkdtempSync(join(tmpdir(),'actual-hosted-tls-'));
const rows=[];let browser;const servers=[];const adapters=[];let origin,foreign,foreignCalls=0,foreignTokens=0,authenticated=0;
const start=Date.now();
/** Retain fixed identifiers and status only; no native error, header, key or token is persisted. */
async function check(id,fn){try{await fn();rows.push({id,status:'passed'});}catch{rows.push({id,status:'failed'});}}
/** Own a random HTTPS listener in this network-isolated container. */
async function listen(handler){const s=createServer(options,handler);servers.push(s);s.listen(0,'127.0.0.1');await once(s,'listening');return `https://127.0.0.1:${s.address().port}`;}
/** Start normal Chromium with its unchanged container HOME so NSS trust resolution remains active. */
const launch=()=>chromium.launch({headless:true,env:{HOME:homedir(),PATH:'/usr/local/bin:/usr/bin:/bin'}});
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=owned-integrated','-addext','subjectAltName=IP:127.0.0.1,DNS:localhost','-addext','basicConstraints=critical,CA:TRUE','-keyout',join(dir,'key.pem'),'-out',join(dir,'cert.pem')],{stdio:'ignore'});
const options={key:readFileSync(join(dir,'key.pem')),cert:readFileSync(join(dir,'cert.pem'))};
const body='<!doctype html><title>Owned unchanged HTTPS fixture</title><p>actual body</p>';
const csp=["default-src 'self'; script-src 'self'","script-src 'none'; object-src 'none'"];
try{
 foreign=await listen((req,res)=>{foreignCalls++;if(req.headers['x-serverless-authorization']===`Bearer ${CONTROL_TOKEN}`)foreignTokens++;req.resume();res.writeHead(200,{'Content-Type':'text/html'});res.end('<p>foreign</p>');});
 origin=await listen((req,res)=>{req.resume();if(req.headers['x-serverless-authorization']===`Bearer ${CONTROL_TOKEN}`)authenticated++;
  if(req.url==='/redirect'){res.writeHead(302,{Location:foreign+'/receiver'});res.end();return;}
  res.writeHead(200,['Content-Type','text/html','Content-Security-Policy',csp[0],'Content-Security-Policy',csp[1],'X-Content-Type-Options','nosniff','X-Content-Type-Options','nosniff']);res.end(body);});
 const target=createOwnedControlTarget(origin);
 const untrusted=createHostedHttp(target);adapters.push(untrusted);
 await check('actual-node-untrusted-tls-refused',async()=>{await assert.rejects(untrusted.docs('/'));const f=await untrusted.close();assert.equal(f.cleanup,'passed');assert.ok(f.failures.length);});
 browser=await launch();
 await check('direct-browser-confirms-untrusted-certificate',async()=>{const c=await browser.newContext();try{const page=await c.newPage();await assert.rejects(page.goto(origin),e=>e.message.includes('ERR_CERT_AUTHORITY_INVALID'));}finally{await c.close();}});
 let lease=await openHostedBrowser(browser,target,'desktop');
 await check('actual-browser-untrusted-tls-refused',async()=>{const before=authenticated;try{await assert.rejects(lease.page.goto(origin));assert.equal(authenticated,before);}finally{const f=await lease.close();assert.equal(f.cleanup,'passed');assert.ok(f.failures.length);}});
 await browser.close();browser=undefined;
 tls.setDefaultCACertificates([...tls.getCACertificates('default'),options.cert.toString()]);
 const db=join(homedir(),'.pki/nssdb');mkdirSync(db,{recursive:true});execFileSync('certutil',['-N','--empty-password','-d',`sql:${db}`],{stdio:'ignore'});
 execFileSync('certutil',['-A','-d',`sql:${db}`,'-n','owned-integrated-ca','-t','C,,','-i',join(dir,'cert.pem')],{stdio:'ignore'});
 const http=createHostedHttp(target);adapters.push(http);
 await check('actual-node-trusted-tls-untouched-response',async()=>{const r=await http.docs('/');assert.equal(r.status,200);assert.equal(hash(r.body),hash(body));assert.deepEqual(r.headers.filter(h=>h.name.toLowerCase()==='content-security-policy').map(h=>h.value),csp);});
 browser=await launch();lease=await openHostedBrowser(browser,target,'desktop');
 await check('actual-browser-trusted-tls-untouched-response',async()=>{const r=await lease.page.goto(origin);assert.equal(r.status(),200);assert.equal(hash(await r.body()),hash(body));const headers=await r.headersArray();assert.deepEqual(headers.filter(h=>h.name.toLowerCase()==='content-security-policy').map(h=>h.value),csp);assert.deepEqual(headers.filter(h=>h.name.toLowerCase()==='x-content-type-options').map(h=>h.value),['nosniff','nosniff']);lease.assertClean();});
 await check('actual-trusted-lease-cleanup',async()=>assert.deepEqual(await lease.close(),{cleanup:'passed',failures:[]}));
 lease=await openHostedBrowser(browser,target,'desktop');
 await check('actual-https-redirect-refused-before-foreign-hop',async()=>{await assert.rejects(lease.page.goto(origin+'/redirect'));const f=await lease.close();assert.equal(f.cleanup,'passed');assert.ok(f.failures.includes('REDIRECT'));assert.equal(foreignCalls,0);assert.equal(foreignTokens,0);});
 lease=await openHostedBrowser(browser,target,'desktop');
 await check('actual-https-foreign-navigation-refused',async()=>{await assert.rejects(lease.page.goto(foreign));const f=await lease.close();assert.equal(f.cleanup,'passed');assert.ok(f.failures.includes('FOREIGN_ATTEMPT'));assert.equal(foreignCalls,0);assert.equal(foreignTokens,0);});
 await check('actual-https-node-redirect-refused',async()=>{await assert.rejects(http.docs('/redirect'));const f=await http.close();assert.equal(f.cleanup,'passed');assert.ok(f.failures.includes('REDIRECT'));assert.equal(foreignCalls,0);assert.equal(foreignTokens,0);});
 await check('actual-authenticated-https-positive-receipts',async()=>assert.ok(authenticated>=4));
 await check('linux-actual-browser-controls-60',async()=>{const actual=await runHostedBrowserControls(browser);writeFileSync('/probe/browser-rows.json',JSON.stringify(actual,null,2)+'\n');assert.equal(actual.length,60);assert.ok(actual.every(r=>r.status==='passed'&&r.cleanup==='passed'));});
}catch{rows.push({id:'setup-or-unhandled',status:'failed'});}
finally{
 await check('all-adapters-cleanup',async()=>{for(const a of adapters)assert.equal((await a.close()).cleanup,'passed');});
 await check('caller-browser-cleanup',async()=>{if(browser)await browser.close();});
 await check('owned-listeners-cleanup',async()=>{for(const s of servers){s.closeAllConnections();await new Promise((resolve,reject)=>s.close(e=>e?reject(e):resolve()));}});
 rmSync(dir,{recursive:true,force:true});
 await check('private-ca-directory-removed',async()=>assert.equal(existsSync(dir),false));
}
const report={kind:'isolated-linux-actual-hosted-adapters',productAcceptance:false,node:process.version,platform:process.platform,arch:process.arch,elapsedMs:Date.now()-start,rows,limits:['Synthetic loopback credentials and certificates only; no Google IAM, token audience or provider identity proof.','Full candidate discovery/protocol integration and application execution are separate gates.']};
writeFileSync('/probe/result.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:rows.filter(r=>r.status==='passed').length,failed:rows.filter(r=>r.status==='failed').map(r=>r.id),elapsedMs:report.elapsedMs}));
process.exitCode=rows.some(r=>r.status!=='passed')?1:0;
```

## Corrected interruption probe

Original `.artifacts/hosted-driver-interruption/attempt-2/run.mjs`, SHA-256
`7e77d5e26c598b77a0aa1ff8bd48aded48762d24a4c286eb8e64d5351faaeb32`. This fence is a sanitized derivative: the single
synthetic token literal at original line 239 is replaced by `[SYNTHETIC_CONTROL_TOKEN_LITERAL_REDACTED]`. Every other
source byte is retained. The original code checked absence of the actual synthetic value; the displayed redaction is not
a replacement execution or a newly verified check.

```text
/**
 * Isolated Linux diagnostic of the unmodified hosted aggregate driver's SIGTERM path. Inputs are the copied source
 * and prepared image only. It starts one owned driver, observes a Chromium descendant and an owned listening socket,
 * signals the driver parent, then retains sanitized failed evidence and independent process/socket observations.
 * No credentials, application/provider requests, source changes, deadline overrides or response replacement.
 * Setup is bounded to 60 seconds, interruption to 45 seconds, final owned cleanup to 10 seconds. Cleanup fallback
 * never upgrades an implementation result. The outer launcher removes this disposable network-none container.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, readlinkSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';

const directory = '/probe';
const suite = join(directory, 'repository/tests/acceptance');
const start = performance.now();
const elapsed = () => Math.round(performance.now() - start);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const before = JSON.parse(readFileSync(join(directory, 'source-before.json')));
const record = {
  kind: 'hosted-lifecycle-diagnostic', productAcceptance: false, status: 'failed',
  runtime: {node: process.version, platform: process.platform, arch: process.arch},
  driverSha256: before.find(row => row.path === 'scripts/hosted-controls.ts').sha256,
  limits: {setupMs: 60000, interruptionMs: 45000, outerCleanupMs: 10000},
  readiness: {}, checks: [], observations: {}, failures: [], outerCleanup: 'pending',
};
let driver, completion, completed, signalled = false, outputBytes = 0, outputOverflow = false;
const witnessed = new Map();
const identity = row => `${row.pid}:${row.startTicks}`;
const browserExecutables = new Set();
const browserCache = join(process.env.HOME, '.cache/ms-playwright');
/** Enumerate only the installed pinned browser's conventional executable paths, never a caller-selected command. */
for (const name of readdirSync(browserCache)) {
  if (!/^chromium(?:_headless_shell)?-\d+$/.test(name)) continue;
  for (const suffix of ['chrome-linux64/chrome', 'chrome-linux/chrome',
    'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell']) {
    const path = join(browserCache, name, suffix);
    if (existsSync(path)) browserExecutables.add(path);
  }
}
record.observations.knownBrowserExecutableCount = browserExecutables.size;

/** Read process identities without retaining arguments, environment, event payloads or credential-bearing data. */
function processes() {
  const result = [];
  for (const name of readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    try {
      const value = readFileSync(`/proc/${name}/stat`, 'utf8');
      const parts = value.slice(value.lastIndexOf(')') + 2).trim().split(/\s+/);
      let executable = 'unknown';
      try { executable = basename(readlinkSync(`/proc/${name}/exe`)); } catch {}
      result.push({pid: Number(name), ppid: Number(parts[1]), group: Number(parts[2]), session: Number(parts[3]),
        state: parts[0], startTicks: parts[19], executable});
    } catch {}
  }
  return result;
}

/** Classify only proven owned processes using transient bounded argv when emulation hides the original executable.
 * Persist only finite role booleans; argv/environment are never logged, copied or returned.
 */
function classifyOwned(rows) {
  return rows.map(row => {
    let nodeArgument = false, knownBrowserArgument = false;
    try {
      const bytes = readFileSync(`/proc/${row.pid}/cmdline`);
      if (bytes.length <= 65536) {
        const args = bytes.toString('utf8').split('\0');
        nodeArgument = args.includes(process.execPath);
        knownBrowserArgument = args.some(arg => browserExecutables.has(arg));
      }
    } catch {}
    return {...row, nodeArgument, knownBrowserArgument};
  });
}

/** Follow only current ancestry rooted at the owned driver's PID; retain later identities across reparenting. */
function descendants(all) {
  const owned = new Set([driver.pid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of all) if (owned.has(row.ppid) && !owned.has(row.pid)) { owned.add(row.pid); changed = true; }
  }
  return all.filter(row => owned.has(row.pid) && row.pid !== driver.pid);
}

/** List kernel TCP listeners and attribute their inode to actual owned process descriptors. */
function listeners(owned = []) {
  const rows = [];
  for (const family of ['tcp', 'tcp6']) {
    for (const line of readFileSync(`/proc/net/${family}`, 'utf8').trim().split('\n').slice(1)) {
      const fields = line.trim().split(/\s+/);
      if (fields[3] === '0A') rows.push({family, local: fields[1], inode: fields[9], owners: []});
    }
  }
  for (const process of owned) {
    try {
      for (const fd of readdirSync(`/proc/${process.pid}/fd`)) {
        try {
          const match = /^socket:\[(\d+)\]$/.exec(readlinkSync(`/proc/${process.pid}/fd/${fd}`));
          if (match) for (const row of rows) if (row.inode === match[1] && !row.owners.includes(identity(process)))
            row.owners.push(identity(process));
        } catch {}
      }
    } catch {}
  }
  return rows;
}

/** Record individual assertions without raw errors; preserve all failed observations for independent review. */
function check(id, passed) { record.checks.push({id, passed: Boolean(passed)}); }
function readJson(path) {
  const bytes = readFileSync(path);
  if (bytes.length > 2097152) throw new Error('EVIDENCE_BOUND');
  return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
}

try {
  const baseline = listeners();
  record.observations.baselineListeners = baseline;
  driver = spawn(process.execPath, ['scripts/hosted-controls.ts'], {
    cwd: suite, env: {HOME: process.env.HOME, PATH: '/usr/local/bin:/usr/bin:/bin',
      LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8', TZ: 'UTC'},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  completion = new Promise(resolve => {
    driver.once('error', () => { completed = {code: null, signal: null, error: 'SPAWN', atMs: elapsed()}; resolve(completed); });
    driver.once('close', (code, signal) => { completed = {code, signal, atMs: elapsed()}; resolve(completed); });
  });
  for (const stream of [driver.stdout, driver.stderr]) stream.on('data', bytes => {
    outputBytes += bytes.length;
    if (outputBytes > 1048576 && !outputOverflow) {
      outputOverflow = true; driver.kill('SIGTERM');
    }
  });
  const setupDeadline = performance.now() + 60000;
  let ready;
  while (performance.now() < setupDeadline && !completed && !outputOverflow) {
    const all = processes();
    const current = classifyOwned(descendants(all));
    for (const row of current) witnessed.set(identity(row), row);
    const direct = current.find(row => row.ppid === driver.pid && row.nodeArgument);
    const chromium = current.filter(row => row.knownBrowserArgument && row.state !== 'Z');
    const sockets = listeners(current).filter(row => row.owners.length && !baseline.some(old => old.inode === row.inode));
    if (direct && chromium.length && sockets.length) {
      ready = {atMs: elapsed(), directChild: direct, chromium, listeners: sockets,
        descendants: current, driver: all.find(row => row.pid === driver.pid)};
      break;
    }
    await delay(15);
  }
  record.readiness = ready ?? {observed: false, atMs: elapsed()};
  check('actual-chromium-and-new-owned-listener-before-signal', Boolean(ready));
  if (!ready) throw new Error('SETUP_READINESS');
  record.observations.signal = {target: 'driver-parent', pid: driver.pid, signal: 'SIGTERM', atMs: elapsed()};
  signalled = driver.kill('SIGTERM');
  check('signal-delivered-to-driver-parent', signalled);
  const interruptionDeadline = performance.now() + 45000;
  while (!completed && performance.now() < interruptionDeadline) {
    for (const row of classifyOwned(descendants(processes()))) witnessed.set(identity(row), row);
    await delay(20);
  }
  check('driver-completed-within-interruption-bound', Boolean(completed));
  if (!completed) throw new Error('INTERRUPTION_BOUND');
  record.observations.parentCompletion = completed;
  check('nonzero-parent-exit', typeof completed.code === 'number' && completed.code !== 0 && completed.signal === null);

  const evidenceRoot = join(suite, '.artifacts/hosted-controls');
  const runs = readdirSync(evidenceRoot).filter(name => /^[a-f0-9-]{36}$/.test(name));
  if (runs.length !== 1) throw new Error('RUN_IDENTITY');
  const runId = runs[0], runPath = join(evidenceRoot, runId);
  const processResult = readJson(join(runPath, 'process.json'));
  const child = readJson(join(runPath, 'child-report.json'));
  const final = readJson(join(runPath, 'report.json'));
  record.observations.runId = runId;
  record.observations.process = processResult;
  record.observations.reportSummary = {status: final.status, cleanup: final.cleanup,
    terminationRequested: final.terminationRequested, controls: final.controls.length,
    failures: final.failures, sourceDigest: final.sourceDigest};
  const expectedDigest = digest(final.sources.map(row => `${row.path}\0${row.sha256}`).join('\n'));
  check('matching-source-run-binding', child.runId === runId && final.runId === runId &&
    child.sourceDigest === final.sourceDigest && final.sourceDigest === expectedDigest &&
    final.sources.every(row => before.some(expected => expected.path === row.path && expected.sha256 === row.sha256)) &&
    JSON.stringify(child.sources) === JSON.stringify(final.sources));
  check('exact-ninety-five-unique-planned-identities', final.planned.length === 95 && new Set(final.planned).size === 95 &&
    JSON.stringify(child.planned) === JSON.stringify(final.planned));
  check('partial-records-never-invent-executions', new Set(final.controls.map(row => row.id)).size === final.controls.length &&
    final.controls.every(row => final.planned.includes(row.id)));
  check('interruption-closed-failed-record', final.status === 'failed' && child.status === 'failed' &&
    final.productAcceptance === false && child.productAcceptance === false &&
    final.terminationRequested === true && child.terminationRequested === true);
  check('graceful-direct-child-reaping-not-forced', processResult.reaped === true && processResult.forced === false &&
    processResult.stopped === true && processResult.failures.includes('ASSERTION'));
  for (const name of ['process.json', 'child-report.json', 'report.json']) {
    const bytes = readFileSync(join(runPath, name));
    writeFileSync(join(directory, name), bytes, {mode: 0o600});
  }
  await delay(250);
  const settleDeadline = performance.now() + 5000;
  let survivors;
  do {
    const all = processes();
    survivors = all.filter(row => witnessed.has(identity(row)));
    if (!survivors.length) break;
    await delay(50);
  } while (performance.now() < settleDeadline);
  const remainingListeners = listeners();
  const survivingListeners = ready.listeners.filter(old => remainingListeners.some(row =>
    row.inode === old.inode && row.family === old.family && row.local === old.local));
  record.observations.witnessedDescendants = [...witnessed.values()];
  record.observations.survivingWitnessedDescendants = survivors;
  record.observations.survivingWitnessedListeners = survivingListeners;
  check('original-direct-child-no-longer-present', !survivors.some(row => identity(row) === identity(ready.directChild)));
  check('all-witnessed-descendants-gone', survivors.length === 0);
  check('all-witnessed-owned-listeners-gone', survivingListeners.length === 0);
  check('no-output-overflow', !outputOverflow);
} catch (error) {
  const allowed = new Set(['EVIDENCE_BOUND', 'SETUP_READINESS', 'INTERRUPTION_BOUND', 'RUN_IDENTITY']);
  record.failures.push(allowed.has(error?.message) ? error.message : 'UNCLASSIFIED_HARNESS_FAILURE');
} finally {
  if (driver && !completed) {
    try { driver.kill('SIGTERM'); } catch {}
    const cleanupDeadline = performance.now() + 10000;
    while (!completed && performance.now() < cleanupDeadline) await delay(25);
    if (!completed) try { driver.kill('SIGKILL'); } catch {}
    record.outerCleanup = 'forced-container-disposal-required';
  } else record.outerCleanup = 'no-harness-force-required';
  record.outputBytesDiscarded = outputBytes;
  record.observations.witnessedDescendants ??= [...witnessed.values()];
  record.durationMs = elapsed();
  const after = before.map(row => ({path: row.path, sha256: digest(readFileSync(join(suite, row.path)))}));
  check('copied-source-bytes-unchanged', JSON.stringify(before) === JSON.stringify(after));
  writeFileSync(join(directory, 'source-after.json'), JSON.stringify(after, null, 2) + '\n');
  const outputs = ['process.json', 'child-report.json', 'report.json'].filter(name => existsSync(join(directory, name)));
  const secretAbsent = outputs.every(name => !readFileSync(join(directory, name), 'utf8').includes('[SYNTHETIC_CONTROL_TOKEN_LITERAL_REDACTED]'));
  check('synthetic-control-token-absent-from-retained-reports', secretAbsent);
  record.evidence = outputs.map(path => ({path, sha256: digest(readFileSync(join(directory, path)))}));
  if (!record.failures.length && record.checks.length >= 12 && record.checks.every(row => row.passed)) record.status = 'passed';
  writeFileSync(join(directory, 'result.json'), JSON.stringify(record, null, 2) + '\n', {mode: 0o600});
  console.log(JSON.stringify({kind: record.kind, status: record.status, checks: record.checks.length,
    passed: record.checks.filter(row => row.passed).length, durationMs: record.durationMs, failures: record.failures}));
  process.exitCode = record.status === 'passed' ? 0 : 1;
}
```

## Outer launcher used by both interruption attempts

The two original `attempt-1/launch.py` and `attempt-2/launch.py` files are byte-identical, SHA-256
`348ef371f051582e21cf5affdf8e46f820427bbeae75d2dfa8b58df73a234e66`. The fence is unchanged. Its final container-removal
observation does not substitute for in-container PID/listener readback. `--init` may reap orphaned descendants; these
captures do not attribute all reaping to the Node parent.

```text
"""Run one owned network-isolated Linux lifecycle diagnostic and preserve bounded evidence.

Inputs: the existing mp3-hosted-controls:local image and this directory's copied source/harness. Side effects: one
named disposable container and ignored local observations. No application, credentials, Docker socket or host trust
is mounted. A 130-second outer timeout force-removes only the named container; removal never proves driver cleanup.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import uuid

directory = Path(__file__).resolve().parent
name = 'hosted-driver-interruption-' + uuid.uuid4().hex[:12]
inspection = subprocess.run(['docker', 'image', 'inspect', 'mp3-hosted-controls:local'],
                            capture_output=True, text=True, check=True)
image = json.loads(inspection.stdout)[0]
facts = {'name': name, 'imageId': image['Id'], 'architecture': image['Architecture'], 'os': image['Os'],
         'network': 'none', 'init': True, 'mount': 'single-diagnostic-directory', 'status': 'pending'}
if facts['architecture'] != 'amd64' or facts['os'] != 'linux':
    raise SystemExit('Image architecture mismatch')
cmd = ['docker', 'run', '--rm', '--init', '--network', 'none', '--platform', 'linux/amd64', '--name', name,
       '--mount', f'type=bind,src={directory},dst=/probe', '--workdir', '/probe', image['Id'],
       'node', '/probe/run.mjs']
try:
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=130)
    facts['exitCode'] = result.returncode
    facts['status'] = 'completed'
    facts['stdoutBytes'] = len(result.stdout)
    facts['stderrBytes'] = len(result.stderr)
    # The harness emits one fixed scalar JSON result; native runtime output is not persisted.
    try:
        value = json.loads(result.stdout)
        if set(value) == {'kind', 'status', 'checks', 'passed', 'durationMs', 'failures'}:
            (directory/'run.log').write_text(json.dumps(value, sort_keys=True) + '\n')
    except (ValueError, UnicodeError):
        facts['sanitizedOutputUnavailable'] = True
except subprocess.TimeoutExpired:
    facts['status'] = 'outer-timeout'
finally:
    remaining = subprocess.run(['docker', 'ps', '-aq', '--filter', f'name=^/{name}$'],
                               capture_output=True, text=True, check=True).stdout.strip()
    facts['containerPresentBeforeOuterRemoval'] = bool(remaining)
    if remaining:
        subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    final = subprocess.run(['docker', 'ps', '-aq', '--filter', f'name=^/{name}$'],
                           capture_output=True, text=True, check=True).stdout.strip()
    facts['containerAbsentAfterward'] = not bool(final)
    facts['harnessSha256'] = hashlib.sha256((directory/'run.mjs').read_bytes()).hexdigest()
    (directory/'container.json').write_text(json.dumps(facts, indent=2) + '\n')
    print(json.dumps({key: facts[key] for key in ['status', 'containerAbsentAfterward', 'imageId']}))
```

## Detector-only correction after the preserved readiness failure

Original attempt-1 harness SHA-256 `eef07c29011737eb48cd2f33de991ee7a1641c001eb9495a468f753f5fe6f59d`. This unified diff
shows the complete first-to-second source change. Markdown formatting removed the context-prefix space on two otherwise
blank lines; changed code and hunk content are preserved. Restore those context prefixes before applying the diff to the
original source. The fenced second source has the separately declared token redaction. Both originals contain that same
synthetic literal.

```text
--- attempt-1/run.mjs
+++ attempt-2/run.mjs
@@ -29,6 +29,18 @@
 let driver, completion, completed, signalled = false, outputBytes = 0, outputOverflow = false;
 const witnessed = new Map();
 const identity = row => `${row.pid}:${row.startTicks}`;
+const browserExecutables = new Set();
+const browserCache = join(process.env.HOME, '.cache/ms-playwright');
+/** Enumerate only the installed pinned browser's conventional executable paths, never a caller-selected command. */
+for (const name of readdirSync(browserCache)) {
+  if (!/^chromium(?:_headless_shell)?-\d+$/.test(name)) continue;
+  for (const suffix of ['chrome-linux64/chrome', 'chrome-linux/chrome',
+    'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell']) {
+    const path = join(browserCache, name, suffix);
+    if (existsSync(path)) browserExecutables.add(path);
+  }
+}
+record.observations.knownBrowserExecutableCount = browserExecutables.size;

 /** Read process identities without retaining arguments, environment, event payloads or credential-bearing data. */
 function processes() {
@@ -47,6 +59,24 @@
   return result;
 }

+/** Classify only proven owned processes using transient bounded argv when emulation hides the original executable.
+ * Persist only finite role booleans; argv/environment are never logged, copied or returned.
+ */
+function classifyOwned(rows) {
+  return rows.map(row => {
+    let nodeArgument = false, knownBrowserArgument = false;
+    try {
+      const bytes = readFileSync(`/proc/${row.pid}/cmdline`);
+      if (bytes.length <= 65536) {
+        const args = bytes.toString('utf8').split('\0');
+        nodeArgument = args.includes(process.execPath);
+        knownBrowserArgument = args.some(arg => browserExecutables.has(arg));
+      }
+    } catch {}
+    return {...row, nodeArgument, knownBrowserArgument};
+  });
+}
+
 /** Follow only current ancestry rooted at the owned driver's PID; retain later identities across reparenting. */
 function descendants(all) {
   const owned = new Set([driver.pid]);
@@ -111,10 +141,10 @@
   let ready;
   while (performance.now() < setupDeadline && !completed && !outputOverflow) {
     const all = processes();
-    const current = descendants(all);
+    const current = classifyOwned(descendants(all));
     for (const row of current) witnessed.set(identity(row), row);
-    const direct = current.find(row => row.ppid === driver.pid && row.executable === 'node');
-    const chromium = current.filter(row => /chrome|chromium/.test(row.executable) && row.state !== 'Z');
+    const direct = current.find(row => row.ppid === driver.pid && row.nodeArgument);
+    const chromium = current.filter(row => row.knownBrowserArgument && row.state !== 'Z');
     const sockets = listeners(current).filter(row => row.owners.length && !baseline.some(old => old.inode === row.inode));
     if (direct && chromium.length && sockets.length) {
       ready = {atMs: elapsed(), directChild: direct, chromium, listeners: sockets,
@@ -131,7 +161,7 @@
   check('signal-delivered-to-driver-parent', signalled);
   const interruptionDeadline = performance.now() + 45000;
   while (!completed && performance.now() < interruptionDeadline) {
-    for (const row of descendants(processes())) witnessed.set(identity(row), row);
+    for (const row of classifyOwned(descendants(processes()))) witnessed.set(identity(row), row);
     await delay(20);
   }
   check('driver-completed-within-interruption-bound', Boolean(completed));
@@ -200,6 +230,7 @@
     record.outerCleanup = 'forced-container-disposal-required';
   } else record.outerCleanup = 'no-harness-force-required';
   record.outputBytesDiscarded = outputBytes;
+  record.observations.witnessedDescendants ??= [...witnessed.values()];
   record.durationMs = elapsed();
   const after = before.map(row => ({path: row.path, sha256: digest(readFileSync(join(suite, row.path)))}));
   check('copied-source-bytes-unchanged', JSON.stringify(before) === JSON.stringify(after));
```
