import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.WC_GRAPHQL_URL || 'http://cms-ecom-os.local/graphql';

export const gqlClient = new GraphQLClient(endpoint, {
  fetch: (url: RequestInfo | URL, init?: RequestInit) => {
    return fetch(url, {
      ...init,
      next: { revalidate: 60, tags: ['wc-products'] },
    });
  }
});
