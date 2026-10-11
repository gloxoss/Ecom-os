/**
 * The checkout form ships identifiers and quantities only. Prices, discounts,
 * tax, shipping and totals are never accepted from the browser; the engine reads
 * those from the authoritative Woo cart.
 */
export interface CheckoutLinePayload {
  productId: string;
  slug: string;
  quantity: number;
  variationId?: string;
}

/** Minimal shape the form needs; matches the store's CartItem without importing it. */
export interface CheckoutLineSource {
  id: string;
  slug: string;
  quantity: number;
  variationId?: string;
}

export interface AuthoritativeCartLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface ParsedCartItems {
  ok: boolean;
  lines: CheckoutLinePayload[];
  error?: string;
}

export function buildCartPayload(lines: CheckoutLineSource[]): CheckoutLinePayload[] {
  return lines.map((line) => ({
    productId: line.id,
    slug: line.slug,
    quantity: line.quantity,
    ...(line.variationId ? { variationId: line.variationId } : {}),
  }));
}

export function serializeCartItems(lines: CheckoutLineSource[]): string {
  return JSON.stringify(buildCartPayload(lines));
}

/**
 * Validates the client payload server-side. Anything malformed or empty is a
 * rejection, never a silently submitted order.
 */
export function parseCartItems(raw: string | null | undefined): ParsedCartItems {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, lines: [], error: 'cart_items_missing' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, lines: [], error: 'cart_items_invalid_json' };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, lines: [], error: 'cart_items_empty' };
  }

  const lines: CheckoutLinePayload[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') {
      return { ok: false, lines: [], error: 'cart_items_invalid_line' };
    }

    const record = entry as Record<string, unknown>;
    const productId = typeof record.productId === 'string' ? record.productId.trim() : '';
    const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
    const quantity = record.quantity;
    const rawVariation = record.variationId;
    const variationId =
      typeof rawVariation === 'string' && rawVariation.trim() !== '' ? rawVariation.trim() : undefined;

    if (!productId) {
      return { ok: false, lines: [], error: 'cart_items_invalid_line' };
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, lines: [], error: 'cart_items_invalid_quantity' };
    }

    lines.push({ productId, slug, quantity, ...(variationId ? { variationId } : {}) });
  }

  return { ok: true, lines };
}

function payloadLineMatchesCartLine(line: CheckoutLinePayload, item: AuthoritativeCartLine): boolean {
  if (line.variationId) {
    // Woo's cart item carries the variation id as its identity (and productId for
    // the store mapper), so a variation line must match the variation, not the parent.
    return item.variantId === line.variationId || item.productId === line.variationId;
  }
  return item.productId === line.productId && !item.variantId;
}

/**
 * Guards the exact defect this flow fixes: an order must never be submitted
 * against a cart that does not contain what the browser thinks it does, and a
 * variation the browser selected cannot be missing from the authoritative cart.
 */
export function cartCoversPayload(
  lines: CheckoutLinePayload[],
  cartLines: AuthoritativeCartLine[]
): boolean {
  if (cartLines.length === 0 || lines.length === 0) return false;
  return lines.every((line) => cartLines.some((item) => payloadLineMatchesCartLine(line, item)));
}
