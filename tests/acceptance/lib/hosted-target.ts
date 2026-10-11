/**
 * Explicit hosted input admission and credential custody. Wrappers receive bounded stdin once; workers reread only
 * the owned private file and immutable suite bytes. Public handles never contain credentials. No import-time I/O.
 * Syntax and byte consistency do not authenticate the provider or release: the trusted parent owns that authority.
 */
import { createHash } from "node:crypto";
import {
  constants,
  closeSync,
  fstatSync,
  futimesSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  FailureCode,
  Finalization,
  HostedSuiteInputV1,
  HostedTarget,
  Profile,
  PublicInput,
} from "./hosted-types.ts";
const root = fileURLToPath(new URL("..", import.meta.url));
const credentials = new WeakMap<object, { value: string; origin: string }>();
let created:
  { directory: string; path: string; dev: number; ino: number; parentDev: number; parentIno: number } | undefined;
const codes = new Set<FailureCode>([
  "INPUT",
  "IDENTITY",
  "ENVIRONMENT",
  "HTTP",
  "TLS",
  "RESPONSE_BOUND",
  "FOREIGN_ATTEMPT",
  "REDIRECT",
  "UNOWNED_PAGE",
  "WORKER",
  "WEBSOCKET",
  "CDP",
  "PAUSED_TIMEOUT",
  "OBSERVER",
  "ASSERTION",
  "OVERFLOW",
  "CLEANUP",
]);
/** Create a diagnostic with no supplied value, path, header or native exception text. */
export function hostedFailure(code: FailureCode): Error & { code: FailureCode } {
  return Object.assign(new Error(code), { code });
}
/** Collapse unknown exceptions to a fixed code before they enter any evidence. */
export function hostedFailureCode(error: unknown, fallback: FailureCode = "ASSERTION"): FailureCode {
  const code = (error as { code?: FailureCode } | null)?.code;
  return code && codes.has(code) ? code : fallback;
}
/** Refuse a failed invariant with only its fixed code; never include supplied values in diagnostics. */
function ensure(ok: unknown, code: FailureCode = "INPUT"): asserts ok {
  if (!ok) throw hostedFailure(code);
}
/** Require exactly the named own fields on a JSON-shaped record before any field interpretation. */
function closed(value: unknown, keys: string[]): asserts value is Record<string, any> {
  ensure(
    value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype,
  );
  ensure(Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)));
}
/** Parse canonical millisecond UTC text and reject normalized, impossible or nonfinite instants. */
function instant(value: unknown): number {
  ensure(typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value));
  const ms = Date.parse(value);
  ensure(Number.isFinite(ms) && new Date(ms).toISOString() === value);
  return ms;
}
/** Accept only a canonical HTTPS origin without credentials or path; no network operation occurs. */
function origin(value: unknown): string {
  ensure(typeof value === "string" && value.length <= 2048);
  try {
    const url = new URL(value);
    ensure(url.protocol === "https:" && value === url.origin && !url.username && !url.password);
    return value;
  } catch {
    throw hostedFailure("INPUT");
  }
}
/** Require lowercase exact-length hexadecimal identity text; placeholders and ambiguous lengths fail. */
function hex(value: unknown, length: number): void {
  ensure(typeof value === "string" && new RegExp(`^[a-f0-9]{${length}}$`).test(value));
}
/** Recursively freeze the already cloned public JSON record so callers cannot change authorization identity. */
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
/** Pure bounded parser used by real stdin/file admission and negative controls. No I/O or credential provenance claim. */
export function parseHostedInput(bytes: Uint8Array, role: Profile, nowMs: number): HostedSuiteInputV1 {
  try {
    ensure(role === "stage" || role === "production");
    ensure(Number.isFinite(nowMs));
    ensure(bytes instanceof Uint8Array && bytes.byteLength > 0 && bytes.byteLength <= 65536);
    ensure(!Buffer.from(bytes.subarray(0, 3)).equals(Buffer.from([239, 187, 191])));
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    closed(value, [
      "schemaVersion",
      "kind",
      "profile",
      "launchId",
      "sourceRevision",
      "suite",
      "target",
      "audience",
      "credential",
    ]);
    ensure(value.schemaVersion === 1 && value.kind === "hosted-suite-input" && value.profile === role);
    hex(value.launchId, 64);
    hex(value.sourceRevision, 40);
    closed(value.suite, ["commit", "tree", "fixtureManifestSha256", "profilesSha256", "inventorySha256"]);
    for (const key of ["commit", "tree"]) hex(value.suite[key], 40);
    for (const key of ["fixtureManifestSha256", "profilesSha256", "inventorySha256"]) hex(value.suite[key], 64);
    closed(value.target, [
      "environment",
      "origin",
      "resourceId",
      "revisionId",
      "observedAt",
      "configurationSha256",
      "registryDigests",
    ]);
    ensure(value.target.environment === role);
    origin(value.target.origin);
    instant(value.target.observedAt);
    ensure(instant(value.target.observedAt) <= nowMs);
    for (const key of ["resourceId", "revisionId"])
      ensure(typeof value.target[key] === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,255}$/.test(value.target[key]));
    hex(value.target.configurationSha256, 64);
    closed(value.target.registryDigests, ["api", "frontend"]);
    for (const key of ["api", "frontend"])
      ensure(
        typeof value.target.registryDigests[key] === "string" &&
          /^sha256:[a-f0-9]{64}$/.test(value.target.registryDigests[key]),
      );
    ensure(origin(value.audience) === value.target.origin);
    closed(value.credential, ["kind", "value", "expiresAt"]);
    ensure(
      value.credential.kind === "google-id-token" &&
        typeof value.credential.value === "string" &&
        Buffer.byteLength(value.credential.value) <= 16384 &&
        /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.credential.value),
    );
    ensure(instant(value.credential.expiresAt) >= nowMs + 990000);
    return value as HostedSuiteInputV1;
  } catch {
    throw hostedFailure("INPUT");
  }
}
/** Split cloned credential bytes into private custody and return only an immutable branded public handle. */
function issue(input: HostedSuiteInputV1): HostedTarget {
  const { credential, ...publicInput } = structuredClone(input);
  const target = Object.freeze({ publicInput: freeze(publicInput) }) as HostedTarget;
  credentials.set(target, { value: credential.value, origin: input.target.origin });
  return target;
}
/** Adapter-only credential projection; input identity is private and headers are copied, never mutated or logged. */
export function invocationHeaders(
  target: HostedTarget,
  destination: string,
  existing: Record<string, string>,
): Record<string, string> {
  const secret = credentials.get(target);
  ensure(secret, "IDENTITY");
  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    throw hostedFailure("FOREIGN_ATTEMPT");
  }
  ensure(url.origin === secret.origin && !url.username && !url.password, "FOREIGN_ATTEMPT");
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(existing)) {
    if (!["authorization", "x-serverless-authorization", "proxy-authorization", "cookie"].includes(key.toLowerCase()))
      result[key] = value;
  }
  result["X-Serverless-Authorization"] = `Bearer ${secret.value}`;
  return result;
}
/** Control-only issuer: no wrapper argument/environment path invokes this. Synthetic owned loopback is not provider proof. */
export function issueOwnedControlTarget(input: HostedSuiteInputV1): HostedTarget {
  const url = new URL(input.target.origin);
  ensure(
    ["http:", "https:"].includes(url.protocol) &&
      ["127.0.0.1", "[::1]"].includes(url.hostname) &&
      input.target.origin === url.origin &&
      input.audience === url.origin &&
      input.credential.value === "owned.control.synthetic",
    "INPUT",
  );
  const copy = structuredClone(input);
  copy.target.origin = "https://owned-control.invalid";
  copy.audience = copy.target.origin;
  parseHostedInput(Buffer.from(JSON.stringify(copy)), input.profile, Date.now());
  return issue(input);
}
/** Compare normalized local paths by ancestry, rather than unsafe string-prefix matching. */
function inside(parent: string, child: string): boolean {
  const r = relative(parent, child);
  return r === "" || (!r.startsWith("..") && !isAbsolute(r));
}
/** Resolve the one parent-owned private directory and reject unsafe location, ownership, mode or symlink ancestry. */
function privateDirectory(): { path: string; dev: number; ino: number } {
  try {
    const raw = process.env.HOSTED_PRIVATE_DIRECTORY;
    ensure(raw && isAbsolute(raw), "ENVIRONMENT");
    const path = resolve(raw);
    ensure(path === raw && realpathSync(path) === path, "ENVIRONMENT");
    let cursor = path;
    while (cursor !== dirname(cursor)) {
      ensure(!lstatSync(cursor).isSymbolicLink(), "ENVIRONMENT");
      cursor = dirname(cursor);
    }
    const stat = lstatSync(path);
    ensure(stat.isDirectory() && (stat.mode & 0o777) === 0o700 && stat.uid === process.getuid?.(), "ENVIRONMENT");
    const checkout = resolve(root, "../..");
    ensure(!inside(checkout, path), "ENVIRONMENT");
    ensure(
      !path.split(/[\\/]/).some((part) => [".artifacts", "test-results", "playwright-report"].includes(part)),
      "ENVIRONMENT",
    );
    return { path, dev: stat.dev, ino: stat.ino };
  } catch {
    throw hostedFailure("ENVIRONMENT");
  }
}
/** Hash the exact extracted source as Git tree objects; never read Git refs, follow symlinks or include installed caches. */
function suiteTree(directory: string, top = true): Buffer {
  const entries: { name: string; mode: string; digest: Buffer; directory: boolean }[] = [];
  for (const name of readdirSync(directory)) {
    if (top && ["node_modules", ".artifacts", "test-results", "playwright-report"].includes(name)) continue;
    const path = join(directory, name),
      stat = lstatSync(path);
    ensure(!stat.isSymbolicLink(), "IDENTITY");
    if (stat.isDirectory()) entries.push({ name, mode: "40000", digest: suiteTree(path, false), directory: true });
    else {
      ensure(stat.isFile() && (stat.mode & 0o111) === 0, "IDENTITY");
      const bytes = readFileSync(path);
      const digest = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest();
      entries.push({ name, mode: "100644", digest, directory: false });
    }
  }
  entries.sort((a, b) =>
    Buffer.compare(Buffer.from(a.name + (a.directory ? "/" : "")), Buffer.from(b.name + (b.directory ? "/" : ""))),
  );
  const bytes = Buffer.concat(
    entries.map((entry) => Buffer.concat([Buffer.from(`${entry.mode} ${entry.name}\0`), entry.digest])),
  );
  return createHash("sha1").update(`tree ${bytes.length}\0`).update(bytes).digest();
}
/** Bind the selected fixed metadata and all extracted regular source bytes to the supplied immutable suite tuple. */
function verifySuite(input: HostedSuiteInputV1): void {
  try {
    for (const [path, key] of [
      ["fixtures/manifest.json", "fixtureManifestSha256"],
      ["fixtures/profiles.json", "profilesSha256"],
      [`fixtures/inventory.${input.profile}.json`, "inventorySha256"],
    ] as const) {
      const bytes = readFileSync(join(root, path));
      ensure(createHash("sha256").update(bytes).digest("hex") === input.suite[key], "IDENTITY");
      ensure(
        JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)).contractRevision === "hosted-reasonless-v1",
        "IDENTITY",
      );
    }
    ensure(suiteTree(root).toString("hex") === input.suite.tree, "IDENTITY");
  } catch {
    throw hostedFailure("IDENTITY");
  }
}
/** Receive one bounded stdin record, verify source bytes, and exclusively persist its private bytes for workers. */
export async function receiveHostedInput(role: Profile, stream: NodeJS.ReadableStream): Promise<HostedTarget> {
  const bytes = await new Promise<Buffer>((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    /** Remove all stdin listeners and the single original deadline on settlement. */
    const cleanup = () => {
      clearTimeout(timer);
      stream.off("data", data);
      stream.off("end", end);
      stream.off("error", error);
    };
    /** Stop reading on any malformed/oversized/late input and emit only the fixed input failure. */
    const fail = () => {
      cleanup();
      stream.pause();
      reject(hostedFailure("INPUT"));
    };
    /** Account actual UTF-8 bytes before retaining a chunk; strings and byte chunks share the same closed bound. */
    const data = (part: unknown) => {
      if (!(typeof part === "string" || part instanceof Uint8Array)) return fail();
      const chunk = Buffer.from(part);
      size += chunk.length;
      if (size > 65536) return fail();
      chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      resolvePromise(Buffer.concat(chunks));
    };
    const error = () => fail();
    const timer = setTimeout(fail, 5000);
    stream.on("data", data);
    stream.once("end", end);
    stream.once("error", error);
  });
  const admittedAt = Date.now();
  const input = parseHostedInput(bytes, role, admittedAt);
  verifySuite(input);
  const directory = privateDirectory();
  ensure(!created, "ENVIRONMENT");
  let fd: number | undefined;
  try {
    const path = join(directory.path, "input.json");
    fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    const stat = fstatSync(fd);
    created = {
      directory: directory.path,
      path,
      dev: stat.dev,
      ino: stat.ino,
      parentDev: directory.dev,
      parentIno: directory.ino,
    };
    writeFileSync(fd, bytes);
    futimesSync(fd, admittedAt / 1000, admittedAt / 1000);
    closeSync(fd);
    fd = undefined;
    return issue(input);
  } catch {
    if (fd !== undefined) closeSync(fd);
    await removeHostedInput();
    throw hostedFailure("ENVIRONMENT");
  }
}
/** Explicit worker/reporter admission. Revalidate file identity/mode/bounds, expiry and all extracted source bytes. */
export async function loadHostedTarget(role: Profile): Promise<HostedTarget> {
  const directory = privateDirectory();
  let fd: number | undefined;
  try {
    const path = join(directory.path, "input.json"),
      before = lstatSync(path);
    ensure(
      before.isFile() &&
        !before.isSymbolicLink() &&
        (before.mode & 0o777) === 0o600 &&
        before.uid === process.getuid?.() &&
        before.size <= 65536,
      "ENVIRONMENT",
    );
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const actual = fstatSync(fd);
    const parent = lstatSync(directory.path);
    ensure(
      parent.dev === directory.dev &&
        parent.ino === directory.ino &&
        actual.dev === before.dev &&
        actual.ino === before.ino,
      "ENVIRONMENT",
    );
    const bytes = readFileSync(fd);
    closeSync(fd);
    fd = undefined;
    const now = Date.now();
    ensure(Number.isFinite(actual.mtimeMs) && actual.mtimeMs <= now, "ENVIRONMENT");
    const input = parseHostedInput(bytes, role, Math.round(actual.mtimeMs));
    ensure(Date.parse(input.credential.expiresAt) > now + 30000, "INPUT");
    verifySuite(input);
    return issue(input);
  } catch (error) {
    if (fd !== undefined) closeSync(fd);
    throw hostedFailure(hostedFailureCode(error, "ENVIRONMENT"));
  }
}
/** Remove only this wrapper's created file after workers exit; replacement or cleanup failure remains a failed result. */
export async function removeHostedInput(): Promise<Finalization> {
  if (!created) return Object.freeze({ cleanup: "passed", failures: [] });
  const own = created;
  created = undefined;
  try {
    const parent = lstatSync(own.directory),
      stat = lstatSync(own.path);
    ensure(
      parent.dev === own.parentDev && parent.ino === own.parentIno && stat.dev === own.dev && stat.ino === own.ino,
      "CLEANUP",
    );
    unlinkSync(own.path);
    return Object.freeze({ cleanup: "passed", failures: [] });
  } catch {
    return Object.freeze({ cleanup: "failed", failures: ["CLEANUP"] as FailureCode[] });
  }
}
