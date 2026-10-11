import { getStoreApiUrl } from './cart';
import { gqlClient } from './graphql';
import { gql } from 'graphql-request';
import { ProductSort } from '@ecom-os/engine';

export interface FetchProductsOptions {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  after?: string | null;
  offset?: number;
  sort?: ProductSort;
  inStockOnly?: boolean;
}

export function mapSortToOrderby(sort?: ProductSort): Array<{ field: string; order: 'ASC' | 'DESC' }> | null {
  if (!sort) return null;
  switch (sort) {
    case 'price_asc':
      return [{ field: 'PRICE', order: 'ASC' }];
    case 'price_desc':
      return [{ field: 'PRICE', order: 'DESC' }];
    case 'newest':
      return [{ field: 'DATE', order: 'DESC' }];
    case 'title_asc':
      return [{ field: 'NAME', order: 'ASC' }];
    case 'title_desc':
      return [{ field: 'NAME', order: 'DESC' }];
    default:
      return null;
  }
}

export async function fetchProducts(options?: FetchProductsOptions): Promise<{ nodes: any[]; pageInfo?: any }> {
  const query = gql`
    query GetProducts(
      $first: Int
      $after: String
      $minPrice: Float
      $maxPrice: Float
      $category: String
      $search: String
      $offset: Int
      $orderby: [ProductsOrderbyInput]
      $stockStatus: StockStatusFilterEnum
    ) {
      products(
        first: $first
        after: $after
        where: {
          minPrice: $minPrice
          maxPrice: $maxPrice
          category: $category
          search: $search
          offset: $offset
          orderby: $orderby
          stockStatus: $stockStatus
        }
      ) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        nodes {
          databaseId
          slug
          name
          sku
          description
          shortDescription
          __typename
          image {
            sourceUrl
            altText
            title
          }
          galleryImages {
            nodes {
              sourceUrl
              altText
              title
            }
          }
          productCategories {
            nodes {
              databaseId
              slug
              name
              description
              parentDatabaseId
            }
          }
          ... on SimpleProduct {
            price(format: RAW)
            regularPrice(format: RAW)
            salePrice(format: RAW)
            stockStatus
            stockQuantity
          }
          ... on VariableProduct {
            price(format: RAW)
            regularPrice(format: RAW)
            salePrice(format: RAW)
            stockStatus
            stockQuantity
            variations(first: 50) {
              nodes {
                databaseId
                sku
                name
                price(format: RAW)
                regularPrice(format: RAW)
                salePrice(format: RAW)
                stockStatus
                stockQuantity
                image {
                  sourceUrl
                  altText
                }
                attributes {
                  nodes {
                    name
                    value
                    label
                  }
                }
              }
            }
          }
          ... on ExternalProduct {
            price(format: RAW)
            regularPrice(format: RAW)
            salePrice(format: RAW)
            stockStatus
            stockQuantity
          }
          ... on GroupedProduct {
            price(format: RAW)
            regularPrice(format: RAW)
            salePrice(format: RAW)
            stockStatus
            stockQuantity
          }
          reviewCount
          averageRating
        }
      }
    }
  `;
  try {
    const data = await gqlClient.request<any>(query, {
      first: options?.limit ?? 20,
      after: options?.after || null,
      minPrice: options?.minPrice,
      maxPrice: options?.maxPrice,
      category: options?.category,
      search: options?.search,
      offset: options?.offset ?? null,
      orderby: mapSortToOrderby(options?.sort),
      stockStatus: options?.inStockOnly ? 'IN_STOCK' : null,
    });
    if (!data?.products) {
      throw new Error('WooCommerce GraphQL returned invalid or missing products payload.');
    }
    return {
      nodes: data.products.nodes || [],
      pageInfo: data.products.pageInfo,
    };
  } catch (err) {
    throw new Error(`Failed to fetch products from WooCommerce: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function fetchCategories(options?: { first?: number }): Promise<any[]> {
  const query = gql`
    query GetCategories($first: Int) {
      productCategories(first: $first) {
        nodes {
          databaseId
          id
          slug
          name
          description
          count
          parentDatabaseId
          image {
            sourceUrl
            altText
          }
        }
      }
    }
  `;
  try {
    const data = await gqlClient.request<any>(query, {
      first: options?.first ?? 100,
    });
    if (!data?.productCategories) {
      throw new Error('WooCommerce GraphQL returned invalid or missing productCategories payload.');
    }
    return data.productCategories.nodes || [];
  } catch (err) {
    throw new Error(`Failed to fetch categories from WooCommerce: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function fetchProductBySlug(slug: string): Promise<any | null> {
  if (!slug || typeof slug !== 'string') {
    throw new Error('A valid product slug must be provided.');
  }

  const query = gql`
    query GetProduct($slug: ID!) {
      product(id: $slug, idType: SLUG) {
        databaseId
        slug
        name
        sku
        description
        shortDescription
        reviewCount
        averageRating
        __typename
        image {
          sourceUrl
          altText
          title
        }
        galleryImages {
          nodes {
            sourceUrl
            altText
            title
          }
        }
        productCategories {
          nodes {
            databaseId
            slug
            name
            description
            parentDatabaseId
          }
        }
        ... on SimpleProduct {
          price(format: RAW)
          regularPrice(format: RAW)
          salePrice(format: RAW)
          stockStatus
          stockQuantity
        }
        ... on VariableProduct {
          price(format: RAW)
          regularPrice(format: RAW)
          salePrice(format: RAW)
          stockStatus
          stockQuantity
          variations(first: 50) {
            nodes {
              databaseId
              sku
              name
              price(format: RAW)
              regularPrice(format: RAW)
              salePrice(format: RAW)
              stockStatus
              stockQuantity
              image {
                sourceUrl
                altText
              }
              attributes {
                nodes {
                  name
                  value
                  label
                }
              }
            }
          }
        }
        ... on ExternalProduct {
          price(format: RAW)
          regularPrice(format: RAW)
          salePrice(format: RAW)
          stockStatus
          stockQuantity
        }
        ... on GroupedProduct {
          price(format: RAW)
          regularPrice(format: RAW)
          salePrice(format: RAW)
          stockStatus
          stockQuantity
        }
        related(first: 8) {
          nodes {
            databaseId
            slug
            name
            image {
              sourceUrl
              altText
            }
            ... on SimpleProduct {
              price(format: RAW)
            }
            ... on VariableProduct {
              price(format: RAW)
            }
          }
        }
      }
    }
  `;
  try {
    const data = await gqlClient.request<any>(query, { slug });
    return data?.product || null;
  } catch (err) {
    throw new Error(`Failed to fetch product '${slug}' from WooCommerce: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Reads a product from WooCommerce's Store API — the plugin-free route to the catalog,
 * used when the GraphQL route is unavailable because the WPGraphQL for WooCommerce
 * bridge is not installed. Returns the raw Store API product, or null.
 */
export async function fetchStoreApiProductBySlug(slug: string): Promise<any | null> {
  if (!slug || typeof slug !== 'string') return null;
  try {
    const response = await fetch(
      `${getStoreApiUrl()}/products?slug=${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );
    if (!response.ok) return null;
    const list = await response.json();
    return Array.isArray(list) && list.length > 0 ? list[0] : null;
  } catch {
    return null;
  }
}
