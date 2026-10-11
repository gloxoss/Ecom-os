import {
  assertIsolationConnection,
  runSql,
  type MysqlConnection,
} from './config.ts';

/**
 * Inspect the restored schema over the target connection.
 *
 * Three coverage areas, each with its own explicit checks so a partial restore is
 * reported as the partial thing it is:
 *   1. table completeness -- a zero-table import is a FAIL, never a success;
 *   2. HPOS orders -- wc_orders, order items, `_variation_id`, `_qty`, total_amount;
 *   3. RFQ quotes/revisions -- quote state, revision linkage, and the quote->order link.
 */

export interface InspectionCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface InspectionResult {
  ok: boolean;
  checks: InspectionCheck[];
  /** Explicit, non-failing observations an operator should read. */
  notes: string[];
  tables: string[];
  tableCount: number;
  prefix: string | null;
  requiredMissing: string[];
}

export interface InspectionOptions {
  binDir: string;
  schema: string;
  requiredTableSuffixes?: string[] | undefined;
}

export const DEFAULT_REQUIRED_TABLE_SUFFIXES = [
  'wc_orders',
  'woocommerce_order_items',
  'woocommerce_order_itemmeta',
  'ecomos_rfq_quotes',
  'ecomos_rfq_revisions',
];

interface CountResult {
  value: number;
  error: string | null;
}

function tryCount(conn: MysqlConnection, sql: string, binDir: string): CountResult {
  const result = runSql(conn, sql, { binDir });
  if (!result.ok) return { value: Number.NaN, error: result.error ?? 'query failed' };
  const parsed = Number.parseInt(result.stdout.trim(), 10);
  return Number.isFinite(parsed)
    ? { value: parsed, error: null }
    : { value: Number.NaN, error: `not a number: ${result.stdout.trim()}` };
}

function check(name: string, ok: boolean, detail: string): InspectionCheck {
  return { name, ok, detail };
}

function findTable(tables: string[], suffix: string, preferredPrefix: string | null): string | null {
  if (preferredPrefix !== null) {
    const exact = tables.find((table) => table === `${preferredPrefix}${suffix}`);
    if (exact) return exact;
  }
  const matches = tables.filter((table) => table.endsWith(suffix));
  if (matches.length === 0) return null;
  // Shortest matching table wins, so `wp_wc_orders` beats `staging_wp_wc_orders`.
  return matches.sort((a, b) => a.length - b.length)[0] ?? null;
}

function detectPrefix(tables: string[]): string | null {
  const orders = tables.filter((table) => table.endsWith('wc_orders'));
  if (orders.length === 0) return null;
  const shortest = orders.sort((a, b) => a.length - b.length)[0] ?? '';
  return shortest.slice(0, shortest.length - 'wc_orders'.length);
}

function quote(value: string): string {
  return `\`${value.replace(/`/g, '``')}\``;
}

export function inspectRestoredSchema(
  conn: MysqlConnection,
  options: InspectionOptions,
): InspectionResult {
  assertIsolationConnection(conn);
  const { binDir, schema } = options;
  const suffixes = options.requiredTableSuffixes ?? DEFAULT_REQUIRED_TABLE_SUFFIXES;

  const tablesResult = runSql(
    conn,
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema.replace(/'/g, "''")}' ORDER BY table_name`,
    { binDir },
  );
  const tables = tablesResult.ok
    ? tablesResult.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const checks: InspectionCheck[] = [];
  const notes: string[] = [];
  const prefix = detectPrefix(tables);

  // ---- 1. table completeness -------------------------------------------------
  checks.push(
    check(
      'tables-imported',
      tables.length > 0,
      tables.length > 0
        ? `${tables.length} table(s) present in \`${schema}\``
        : `0 tables in \`${schema}\`: an empty import is a FAIL, never a successful restore`,
    ),
  );

  const requiredMissing: string[] = [];
  for (const suffix of suffixes) {
    if (!findTable(tables, suffix, prefix)) requiredMissing.push(suffix);
  }
  checks.push(
    check(
      'required-tables-present',
      requiredMissing.length === 0,
      requiredMissing.length === 0
        ? `all ${suffixes.length} required table(s) present (prefix: ${prefix ?? 'unknown'})`
        : `missing required table(s): ${requiredMissing.join(', ')}`,
    ),
  );

  // ---- 2. HPOS orders --------------------------------------------------------
  const ordersTable = findTable(tables, 'wc_orders', prefix);
  checks.push(
    check(
      'hpos-orders-table-present',
      ordersTable !== null,
      ordersTable !== null ? `${ordersTable} restored` : 'no *wc_orders table found; HPOS orders were not restored',
    ),
  );

  if (ordersTable) {
    const orders = tryCount(conn, `SELECT COUNT(*) FROM ${quote(ordersTable)}`, binDir);
    checks.push(
      check(
        'hpos-orders-present',
        orders.value > 0,
        orders.error ?? `${orders.value} order(s) in ${ordersTable}`,
      ),
    );

    const emptyStatus = tryCount(
      conn,
      `SELECT COUNT(*) FROM ${quote(ordersTable)} WHERE status IS NULL OR status = ''`,
      binDir,
    );
    checks.push(
      check(
        'hpos-order-status-integrity',
        emptyStatus.value === 0,
        emptyStatus.error ?? `${emptyStatus.value} order(s) with an empty status`,
      ),
    );

    const nullTotal = tryCount(
      conn,
      `SELECT COUNT(*) FROM ${quote(ordersTable)} WHERE total_amount IS NULL`,
      binDir,
    );
    checks.push(
      check(
        'hpos-order-total-integrity',
        nullTotal.value === 0,
        nullTotal.error ?? `${nullTotal.value} order(s) with a null total_amount`,
      ),
    );

    const guestOrders = tryCount(
      conn,
      `SELECT COUNT(*) FROM ${quote(ordersTable)} WHERE customer_id = 0`,
      binDir,
    );
    notes.push(
      guestOrders.error ?? `${guestOrders.value} guest order(s) preserved (customer_id = 0)`,
    );

    const itemsTable = findTable(tables, 'woocommerce_order_items', prefix);
    checks.push(
      check(
        'hpos-order-items-table-present',
        itemsTable !== null,
        itemsTable !== null ? `${itemsTable} restored` : 'no *woocommerce_order_items table found',
      ),
    );

    if (itemsTable) {
      const items = tryCount(conn, `SELECT COUNT(*) FROM ${quote(itemsTable)}`, binDir);
      checks.push(
        check(
          'hpos-order-items-present',
          items.value > 0,
          items.error ?? `${items.value} order item(s) in ${itemsTable}`,
        ),
      );
    }

    const metaTable = findTable(tables, 'woocommerce_order_itemmeta', prefix);
    checks.push(
      check(
        'hpos-order-itemmeta-table-present',
        metaTable !== null,
        metaTable !== null ? `${metaTable} restored` : 'no *woocommerce_order_itemmeta table found',
      ),
    );

    if (metaTable) {
      const qty = tryCount(
        conn,
        `SELECT COUNT(*) FROM ${quote(metaTable)} WHERE meta_key = '_qty'`,
        binDir,
      );
      checks.push(
        check(
          'hpos-order-itemmeta-qty',
          qty.value > 0,
          qty.error ?? `${qty.value} item meta row(s) with meta_key = '_qty'`,
        ),
      );

      const variationMeta = tryCount(
        conn,
        `SELECT COUNT(*) FROM ${quote(metaTable)} WHERE meta_key = '_variation_id'`,
        binDir,
      );
      // `_variation_id` is only expected when the catalog has variable products. Look
      // for the legacy/non-HPOS signal before treating a zero count as a loss.
      let itemsWithVariation = 0;
      if (itemsTable) {
        const hasColumn = runSql(
          conn,
          `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '${schema.replace(/'/g, "''")}' ` +
            `AND table_name = '${itemsTable.replace(/'/g, "''")}' AND column_name = 'variation_id'`,
          { binDir },
        );
        if (hasColumn.ok && hasColumn.stdout.trim() === '1') {
          itemsWithVariation = tryCount(
            conn,
            `SELECT COUNT(*) FROM ${quote(itemsTable)} WHERE variation_id <> 0`,
            binDir,
          ).value;
        }
      }
      const variationOk =
        variationMeta.error === null && (variationMeta.value > 0 || itemsWithVariation === 0);
      checks.push(
        check(
          'hpos-order-itemmeta-variation-id',
          variationOk,
          variationMeta.error ??
            `${variationMeta.value} item meta row(s) with meta_key = '_variation_id'` +
              (variationMeta.value === 0 && itemsWithVariation === 0
                ? ' (zero is valid when the restored catalog has no variable products)'
                : ''),
        ),
      );
    }
  }

  // ---- 3. RFQ quotes / revisions / quote->order link -------------------------
  const quotesTable = findTable(tables, 'ecomos_rfq_quotes', prefix);
  const revisionsTable = findTable(tables, 'ecomos_rfq_revisions', prefix);

  checks.push(
    check(
      'rfq-quotes-table-present',
      quotesTable !== null,
      quotesTable !== null ? `${quotesTable} restored` : 'no *ecomos_rfq_quotes table found',
    ),
  );
  checks.push(
    check(
      'rfq-revisions-table-present',
      revisionsTable !== null,
      revisionsTable !== null ? `${revisionsTable} restored` : 'no *ecomos_rfq_revisions table found',
    ),
  );

  if (quotesTable) {
    const quotes = tryCount(conn, `SELECT COUNT(*) FROM ${quote(quotesTable)}`, binDir);
    notes.push(quotes.error ?? `${quotes.value} RFQ quote(s) in ${quotesTable}`);

    const badQuotes = tryCount(
      conn,
      `SELECT COUNT(*) FROM ${quote(quotesTable)} WHERE state IS NULL OR state = ''`,
      binDir,
    );
    checks.push(
      check(
        'rfq-quote-state-integrity',
        badQuotes.value === 0,
        badQuotes.error ?? `${badQuotes.value} quote(s) with an empty state`,
      ),
    );

    // quote -> order link: the column must exist and every non-null value must
    // reference a real restored HPOS order.
    const hasLinkColumn = runSql(
      conn,
      `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '${schema.replace(/'/g, "''")}' ` +
        `AND table_name = '${quotesTable.replace(/'/g, "''")}' AND column_name = 'converted_order_id'`,
      { binDir },
    );
    const linkColumnPresent = hasLinkColumn.ok && hasLinkColumn.stdout.trim() === '1';
    checks.push(
      check(
        'rfq-quote-order-link-column',
        linkColumnPresent,
        linkColumnPresent
          ? `${quotesTable}.converted_order_id present`
          : hasLinkColumn.ok
            ? `${quotesTable}.converted_order_id is missing; the quote->order link cannot be verified`
            : `could not read column metadata: ${hasLinkColumn.error}`,
      ),
    );

    if (linkColumnPresent && ordersTable) {
      const dangling = tryCount(
        conn,
        `SELECT COUNT(*) FROM ${quote(quotesTable)} q LEFT JOIN ${quote(ordersTable)} o ` +
          'ON o.id = q.converted_order_id WHERE q.converted_order_id IS NOT NULL AND o.id IS NULL',
        binDir,
      );
      const linked = tryCount(
        conn,
        `SELECT COUNT(*) FROM ${quote(quotesTable)} WHERE converted_order_id IS NOT NULL`,
        binDir,
      );
      checks.push(
        check(
          'rfq-quote-order-link-integrity',
          dangling.value === 0,
          dangling.error ??
            `${linked.value} converted quote(s); ${dangling.value} with a dangling converted_order_id`,
        ),
      );
    } else if (linkColumnPresent && !ordersTable) {
      checks.push(
        check(
          'rfq-quote-order-link-integrity',
          false,
          'quote->order link cannot be verified: no HPOS orders table was restored',
        ),
      );
    }
  }

  if (quotesTable && revisionsTable) {
    const orphans = tryCount(
      conn,
      `SELECT COUNT(*) FROM ${quote(revisionsTable)} r LEFT JOIN ${quote(quotesTable)} q ` +
        'ON q.id = r.quote_id WHERE q.id IS NULL',
      binDir,
    );
    checks.push(
      check(
        'rfq-revisions-reference-quotes',
        orphans.value === 0,
        orphans.error ?? `${orphans.value} orphan revision(s)`,
      ),
    );
  }

  const ok = checks.every((item) => item.ok);
  return {
    ok,
    checks,
    notes,
    tables,
    tableCount: tables.length,
    prefix,
    requiredMissing,
  };
}
