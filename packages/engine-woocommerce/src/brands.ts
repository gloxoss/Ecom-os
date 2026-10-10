import { gqlClient } from './graphql';
import { gql } from 'graphql-request';
import { restFetch } from './rest';
import { WCBrand } from './mappers';

export interface BrandCapability {
  supported: boolean;
  source?: 'graphql' | 'rest';
  reason?: string;
}

let cachedCapability: BrandCapability | null = null;

export function resetBrandsCapabilityCache(): void {
  cachedCapability = null;
}

export async function checkBrandsCapability(): Promise<BrandCapability> {
  if (cachedCapability) return cachedCapability;

  // 1. Try GraphQL productBrands query
  try {
    const query = gql`
      query CheckProductBrandsCapability {
        productBrands(first: 1) {
          nodes {
            databaseId
            slug
            name
          }
        }
      }
    `;
    await gqlClient.request(query);
    cachedCapability = { supported: true, source: 'graphql' };
    return cachedCapability;
  } catch (gqlErr: any) {
    const errMsg = gqlErr instanceof Error ? gqlErr.message : String(gqlErr);
    // If it's a schema validation error (e.g. Unknown type or field "productBrands")
    if (errMsg.includes('Cannot query field') || errMsg.includes('Unknown type') || errMsg.includes('Validation error')) {
      // 2. Try REST API endpoint
      try {
        const restResult = await restFetch('/wp-json/wc/v3/products/brands?per_page=1');
        if (Array.isArray(restResult)) {
          cachedCapability = { supported: true, source: 'rest' };
          return cachedCapability;
        }
      } catch {
        // Both GraphQL and REST lack brand support
        cachedCapability = {
          supported: false,
          reason: 'Native product_brand taxonomy is not available on this WooCommerce backend.',
        };
        return cachedCapability;
      }
    } else {
      // Network or server error - do not cache false capability on transient errors
      throw new Error(`Failed to check WooCommerce brand capability: ${errMsg}`);
    }
  }

  cachedCapability = {
    supported: false,
    reason: 'Native product_brand taxonomy is not available on this WooCommerce backend.',
  };
  return cachedCapability;
}

export async function fetchBrands(options?: { first?: number }): Promise<WCBrand[]> {
  const capability = await checkBrandsCapability();
  if (!capability.supported) {
    return [];
  }

  const limit = options?.first ?? 100;

  if (capability.source === 'graphql') {
    const query = gql`
      query GetProductBrands($first: Int) {
        productBrands(first: $first) {
          nodes {
            databaseId
            id
            slug
            name
            description
            count
            image {
              sourceUrl
              altText
            }
          }
        }
      }
    `;
    try {
      const data = await gqlClient.request<any>(query, { first: limit });
      return data?.productBrands?.nodes || [];
    } catch (err) {
      throw new Error(`Failed to fetch product brands from WooCommerce GraphQL: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // REST fallback
  try {
    const data = await restFetch(`/wp-json/wc/v3/products/brands?per_page=${limit}`);
    if (!Array.isArray(data)) {
      throw new Error('WooCommerce REST returned invalid brand response format.');
    }
    return data.map((b: any) => ({
      databaseId: b.id,
      id: String(b.id),
      slug: b.slug,
      name: b.name,
      description: b.description || null,
      count: b.count,
      image: b.image ? { sourceUrl: b.image.src, altText: b.image.alt || b.name } : null,
    }));
  } catch (err) {
    throw new Error(`Failed to fetch product brands from WooCommerce REST: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function fetchBrandBySlug(slug: string): Promise<WCBrand | null> {
  if (!slug || typeof slug !== 'string') {
    throw new Error('A valid brand slug must be provided.');
  }

  const capability = await checkBrandsCapability();
  if (!capability.supported) {
    return null;
  }

  if (capability.source === 'graphql') {
    const query = gql`
      query GetProductBrandBySlug($slug: ID!) {
        productBrand(id: $slug, idType: SLUG) {
          databaseId
          id
          slug
          name
          description
          count
          image {
            sourceUrl
            altText
          }
        }
      }
    `;
    try {
      const data = await gqlClient.request<any>(query, { slug });
      return data?.productBrand || null;
    } catch (err) {
      throw new Error(`Failed to fetch brand '${slug}' from WooCommerce GraphQL: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // REST fallback
  try {
    const data = await restFetch(`/wp-json/wc/v3/products/brands?slug=${encodeURIComponent(slug)}`);
    if (Array.isArray(data) && data.length > 0) {
      const b = data[0];
      return {
        databaseId: b.id,
        id: String(b.id),
        slug: b.slug,
        name: b.name,
        description: b.description || null,
        count: b.count,
        image: b.image ? { sourceUrl: b.image.src, altText: b.image.alt || b.name } : null,
      };
    }
    return null;
  } catch (err) {
    throw new Error(`Failed to fetch brand '${slug}' from WooCommerce REST: ${err instanceof Error ? err.message : String(err)}`);
  }
}
