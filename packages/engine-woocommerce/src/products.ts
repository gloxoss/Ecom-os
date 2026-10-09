import { gqlClient } from './graphql';
import { gql } from 'graphql-request';

export async function fetchProducts(options?: { category?: string; minPrice?: number; maxPrice?: number }) {
  // Include all product types so price is never null from a missing fragment
  const query = gql`
    query GetProducts($minPrice: Float, $maxPrice: Float) {
      products(first: 20, where: { minPrice: $minPrice, maxPrice: $maxPrice }) {
        nodes {
          databaseId
          slug
          name
          description
          image {
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price(format: RAW)
            regularPrice(format: RAW)
          }
          ... on VariableProduct {
            price(format: RAW)
          }
          ... on ExternalProduct {
            price(format: RAW)
            regularPrice(format: RAW)
          }
        }
      }
    }
  `;
  try {
    const data = await gqlClient.request<any>(query, {
      minPrice: options?.minPrice,
      maxPrice: options?.maxPrice
    });
    return data.products?.nodes || [];
  } catch (err) {
    console.error('Failed to fetchProducts:', err);
    return [];
  }
}

export async function fetchCategories() {
  const query = gql`
    query GetCategories {
      productCategories(first: 20) {
        nodes {
          databaseId
          slug
          name
        }
      }
    }
  `;
  try {
    const data = await gqlClient.request<any>(query);
    return data.productCategories?.nodes || [];
  } catch (err) {
    console.error('Failed to fetchCategories:', err);
    return [];
  }
}

export async function fetchProductBySlug(slug: string) {
  const query = gql`
    query GetProduct($slug: ID!) {
      product(id: $slug, idType: SLUG) {
        databaseId
        slug
        name
        description
        reviewCount
        averageRating
        image {
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          price(format: RAW)
          regularPrice(format: RAW)
        }
        ... on VariableProduct {
          price(format: RAW)
        }
        ... on ExternalProduct {
          price(format: RAW)
          regularPrice(format: RAW)
        }
        related(first: 4) {
          nodes {
            databaseId
            slug
            name
            image {
              sourceUrl
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
    return data.product || null;
  } catch (err) {
    console.error('Failed to fetchProductBySlug:', err);
    return null;
  }
}
