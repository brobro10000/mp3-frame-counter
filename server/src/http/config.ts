/** Fixed resource budgets for one API instance; configuration validation performs no I/O or allocation. */
export interface ApiBudgets {
  /** Maximum concurrently admitted upload lifecycles, including analysis and response serialization. */
  readonly maxActiveUploads: number;
  /** Maximum accepted TCP connections, including idle and incomplete-header connections. */
  readonly maxConnections: number;
  /** Absolute body collection deadline in milliseconds. */
  readonly bodyTimeoutMs: number;
  /** Body inactivity deadline in milliseconds, refreshed only by received data. */
  readonly inactivityTimeoutMs: number;
  /** Native incomplete-header deadline in milliseconds. */
  readonly headersTimeoutMs: number;
  /** Maximum graceful socket drain time in milliseconds. */
  readonly shutdownTimeoutMs: number;
  /** Maximum readable rejection drain time in milliseconds. */
  readonly rejectionDrainMs: number;
}

export const DEFAULT_API_BUDGETS: Readonly<ApiBudgets> = Object.freeze({
  maxActiveUploads: 2,
  maxConnections: 64,
  bodyTimeoutMs: 30_000,
  inactivityTimeoutMs: 10_000,
  headersTimeoutMs: 10_000,
  shutdownTimeoutMs: 5_000,
  rejectionDrainMs: 1_000,
});

/** Return independent validated budgets; reject nonpositive/unsafe values and admission above connection capacity. */
export function validateApiBudgets(overrides: Partial<ApiBudgets> = {}): Readonly<ApiBudgets> {
  const budgets = { ...DEFAULT_API_BUDGETS, ...overrides };
  for (const value of Object.values(budgets)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error("API budgets must be positive safe integers.");
  }
  if (budgets.maxActiveUploads > budgets.maxConnections) {
    throw new Error("The upload budget cannot exceed the connection budget.");
  }
  return Object.freeze(budgets);
}

/** Parse the sole process setting PORT; tests use listen directly to select ephemeral port zero. */
export function parsePort(value: string | undefined): number {
  if (value === undefined) return 3_000;
  if (!/^[0-9]+$/.test(value)) throw new Error("PORT must be an integer between 1 and 65535.");
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}
