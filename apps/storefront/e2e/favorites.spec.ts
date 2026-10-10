import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Storefront Local Favorites Contract (ECO-803)', () => {
  const WISHLIST_KEY = 'ecom_wishlist';

  // In-memory mock storage simulating browser localStorage
  let memoryStorage: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      memoryStorage = {};
    },
  };

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  function parseWishlist(): string[] {
    try {
      const stored = mockLocalStorage.getItem(WISHLIST_KEY);
      const parsed = JSON.parse(stored || '[]');
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  function toggleWishlist(productId: string): string[] {
    const current = parseWishlist();
    const updated = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    mockLocalStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    return updated;
  }

  it('allows guests to save, check, and toggle favorites without customer accounts', () => {
    assert.deepEqual(parseWishlist(), []);

    // Add item 1
    const afterFirst = toggleWishlist('prod-wheelchair-01');
    assert.deepEqual(afterFirst, ['prod-wheelchair-01']);
    assert.ok(parseWishlist().includes('prod-wheelchair-01'));

    // Add item 2
    const afterSecond = toggleWishlist('prod-tensiometer-02');
    assert.equal(afterSecond.length, 2);
    assert.ok(afterSecond.includes('prod-tensiometer-02'));

    // Remove item 1
    const afterRemoval = toggleWishlist('prod-wheelchair-01');
    assert.deepEqual(afterRemoval, ['prod-tensiometer-02']);
    assert.equal(parseWishlist().includes('prod-wheelchair-01'), false);
  });

  it('recovers gracefully from corrupted storage or malformed JSON without crashing', () => {
    mockLocalStorage.setItem(WISHLIST_KEY, '{ invalid: json ]');
    assert.deepEqual(parseWishlist(), []);

    // Toggling heals storage
    const healed = toggleWishlist('prod-mattress-03');
    assert.deepEqual(healed, ['prod-mattress-03']);
  });

  it('filters out non-string primitives from storage', () => {
    mockLocalStorage.setItem(WISHLIST_KEY, JSON.stringify(['valid-id', 12345, null, { obj: true }]));
    const clean = parseWishlist();
    assert.deepEqual(clean, ['valid-id']);
  });
});
