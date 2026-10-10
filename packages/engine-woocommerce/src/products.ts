import { gqlClient } from './graphql';
import { gql } from 'graphql-request';

export interface FetchProductsOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  after?: string | null;
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
    ) {
      products(
        first: $first
        after: $after
        where: {
          minPrice: $minPrice
          maxPrice: $maxPrice
          category: $category
          search: $search
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
