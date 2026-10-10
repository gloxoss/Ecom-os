import {
  SearchProvider,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
  IndexHealth,
  IndexSyncResult,
  SearchDocument,
} from './types';

export interface FallbackSearchProviderOptions {
  primary: SearchProvider;
  fallback: SearchProvider;
  logger?: ((level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => void) | undefined;
}

/**
 * FallbackSearchProvider wraps a primary search provider (e.g., Meilisearch, Typesense)
 * with an authoritative fallback provider (e.g., native WooCommerce search).
 *
 * Invariants:
 * - When primary fails, fallback is executed and marked with fallbackUsed: true.
 * - Errors are NOT swallowed into silent empty results: if both fail, an explicit error is thrown.
 * - Health reporting reflects primary state, falling back to 'degraded' if fallback is healthy.
 */
export class FallbackSearchProvider implements SearchProvider {
  readonly name: string;
  private readonly primary: SearchProvider;
  private readonly fallback: SearchProvider;
  private readonly log?: ((level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => void) | undefined;

  constructor(options: FallbackSearchProviderOptions) {
    this.primary = options.primary;
    this.fallback = options.fallback;
    this.log = options.logger;
    this.name = `fallback(${this.primary.name}->${this.fallback.name})`;
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const result = await this.primary.search(query);
      return {
        ...result,
        fallbackUsed: false,
      };
    } catch (primaryErr: unknown) {
      const primaryMessage = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      this.log?.('warn', `Primary search provider "${this.primary.name}" failed, falling back to "${this.fallback.name}"`, {
        error: primaryMessage,
        query: query.term,
      });

      try {
        const fallbackResult = await this.fallback.search(query);
        return {
          ...fallbackResult,
          fallbackUsed: true,
        };
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        this.log?.('error', `Both search providers failed. Primary: ${primaryMessage}; Fallback: ${fallbackMessage}`);
        throw new Error(
          `Search service unavailable. Primary error: [${primaryMessage}]; Fallback error: [${fallbackMessage}]`
        );
      }
    }
  }

  async suggest(term: string, limit: number = 5): Promise<SearchSuggestion[]> {
    try {
      return await this.primary.suggest(term, limit);
    } catch (err: unknown) {
      this.log?.('warn', `Primary suggest failed on "${this.primary.name}", falling back to "${this.fallback.name}"`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return await this.fallback.suggest(term, limit);
    }
  }

  async health(): Promise<IndexHealth> {
    let primaryHealth: IndexHealth;
    try {
      primaryHealth = await this.primary.health();
    } catch (err: unknown) {
      primaryHealth = {
        status: 'unhealthy',
        provider: this.primary.name,
        documentCount: 0,
        message: err instanceof Error ? err.message : String(err),
      };
    }

    if (primaryHealth.status === 'healthy') {
      return primaryHealth;
    }

    let fallbackHealth: IndexHealth;
    try {
      fallbackHealth = await this.fallback.health();
    } catch (err: unknown) {
      fallbackHealth = {
        status: 'unhealthy',
        provider: this.fallback.name,
        documentCount: 0,
        message: err instanceof Error ? err.message : String(err),
      };
    }

    if (fallbackHealth.status === 'healthy') {
      return {
        status: 'degraded',
        provider: this.name,
        documentCount: fallbackHealth.documentCount,
        message: `Primary [${this.primary.name}] is ${primaryHealth.status} (${primaryHealth.message || 'error'}), serving from fallback [${this.fallback.name}]`,
      };
    }

    return {
      status: 'unhealthy',
      provider: this.name,
      documentCount: 0,
      message: `Both primary [${this.primary.name}] and fallback [${this.fallback.name}] are unhealthy.`,
    };
  }

  async sync(documents: SearchDocument[]): Promise<IndexSyncResult> {
    const primaryResult = await this.primary.sync(documents);
    try {
      await this.fallback.sync(documents);
    } catch (err) {
      this.log?.('warn', `Fallback sync warning on "${this.fallback.name}":`, err);
    }
    return primaryResult;
  }

  async delete(documentIds: string[]): Promise<{ deleted: number }> {
    const primaryResult = await this.primary.delete(documentIds);
    try {
      await this.fallback.delete(documentIds);
    } catch (err) {
      this.log?.('warn', `Fallback delete warning on "${this.fallback.name}":`, err);
    }
    return primaryResult;
  }

  async clear(): Promise<void> {
    await this.primary.clear();
    await this.fallback.clear();
  }
}

