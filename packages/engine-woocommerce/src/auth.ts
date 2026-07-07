import { Customer, AuthSession, LoginInput, RegisterInput, Order } from '@ecom-os/engine';
import { restFetch } from './rest';
import { gqlClient } from './graphql';
import { gql } from 'graphql-request';

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { clientMutationId: "login", username: $username, password: $password }) {
      authToken
      customer {
        databaseId
        email
        firstName
        lastName
      }
    }
  }
`;

export async function loginGql(input: LoginInput): Promise<AuthSession> {
  try {
    const data = await gqlClient.request<any>(LOGIN_MUTATION, {
      username: input.email,
      password: input.password,
    });
    const { authToken, customer } = data?.login ?? {};
    if (!authToken) throw new Error('No auth token returned');
    return {
      token: authToken,
      customer: {
        id: String(customer.databaseId),
        email: customer.email,
        firstName: customer.firstName ?? '',
        lastName: customer.lastName ?? '',
      },
    };
  } catch {
    // ponytail: requires WPGraphQL JWT Authentication plugin on the WP instance
    throw new Error('Login failed. Ensure WPGraphQL JWT Authentication plugin is active.');
  }
}

export async function registerRest(input: RegisterInput): Promise<AuthSession> {
  await restFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName,
      username: input.email,
    }),
  });
  // After registering, log in to get the token
  return loginGql({ email: input.email, password: input.password });
}

export async function getCustomerByToken(token: string): Promise<Customer | null> {
  try {
    // Decode JWT payload (base64url) to extract WP user ID — no extra lib needed
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const customerId = payload?.data?.user?.id;
    if (!customerId) return null;

    const response = await restFetch(`/customers/${customerId}`);
    return {
      id: String(response.id),
      email: response.email,
      firstName: response.first_name ?? '',
      lastName: response.last_name ?? '',
    };
  } catch {
    return null;
  }
}

export async function getCustomerOrdersRest(customerId: string): Promise<Order[]> {
  try {
    const raw = await restFetch(`/orders?customer=${customerId}&per_page=20`);
    if (!Array.isArray(raw)) return [];
    return raw.map((o: any) => ({
      id: String(o.id),
      status: o.status ?? 'unknown',
      total: {
        amount_minor: Math.round(parseFloat(o.total ?? '0') * 100),
        currency: o.currency ?? 'USD',
      },
      items: [],
      customer: {
        id: String(o.customer_id ?? 0),
        email: o.billing?.email ?? '',
        firstName: o.billing?.first_name ?? '',
        lastName: o.billing?.last_name ?? '',
      },
    }));
  } catch {
    return [];
  }
}

export async function listAddressesRest(customerId: string): Promise<any[]> {
  try {
    const response = await restFetch(`/customers/${customerId}`);
    const addresses = [];
    if (response.billing && response.billing.address_1) {
      addresses.push({
        id: 'billing',
        firstName: response.billing.first_name ?? '',
        lastName: response.billing.last_name ?? '',
        street: response.billing.address_1 ?? '',
        city: response.billing.city ?? '',
        postalCode: response.billing.postcode ?? '',
        country: response.billing.country ?? '',
        isDefaultBilling: true,
      });
    }
    if (response.shipping && response.shipping.address_1) {
      addresses.push({
        id: 'shipping',
        firstName: response.shipping.first_name ?? '',
        lastName: response.shipping.last_name ?? '',
        street: response.shipping.address_1 ?? '',
        city: response.shipping.city ?? '',
        postalCode: response.shipping.postcode ?? '',
        country: response.shipping.country ?? '',
        isDefaultShipping: true,
      });
    }
    return addresses;
  } catch {
    return [];
  }
}

export async function updateAddressRest(customerId: string, addressId: string, input: any): Promise<any> {
  const isBilling = addressId === 'billing';
  
  const payload = {
    [isBilling ? 'billing' : 'shipping']: {
      first_name: input.firstName,
      last_name: input.lastName,
      address_1: input.street,
      city: input.city,
      postcode: input.postalCode,
      country: input.country,
    }
  };

  const response = await restFetch(`/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const updated = isBilling ? response.billing : response.shipping;
  
  return {
    id: addressId,
    firstName: updated?.first_name ?? '',
    lastName: updated?.last_name ?? '',
    street: updated?.address_1 ?? '',
    city: updated?.city ?? '',
    postalCode: updated?.postcode ?? '',
    country: updated?.country ?? '',
    isDefaultBilling: isBilling,
    isDefaultShipping: !isBilling,
  };
}

export async function createAddressRest(customerId: string, input: any): Promise<any> {
  // Try to set it as billing first if billing is empty, else shipping
  const addresses = await listAddressesRest(customerId);
  const hasBilling = addresses.some(a => a.id === 'billing');
  
  return updateAddressRest(customerId, hasBilling ? 'shipping' : 'billing', input);
}

export async function deleteAddressRest(customerId: string, addressId: string): Promise<void> {
  const isBilling = addressId === 'billing';
  const payload = {
    [isBilling ? 'billing' : 'shipping']: {
      first_name: '',
      last_name: '',
      address_1: '',
      city: '',
      postcode: '',
      country: '',
    }
  };
  await restFetch(`/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

const SEND_RESET_EMAIL_MUTATION = gql`
  mutation SendPasswordResetEmail($username: String!) {
    sendPasswordResetEmail(input: { clientMutationId: "resetEmail", username: $username }) {
      user { email }
    }
  }
`;

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetUserPassword($key: String!, $login: String!, $password: String!) {
    resetUserPassword(input: {
      clientMutationId: "resetPwd"
      key: $key
      login: $login
      password: $password
    }) {
      user { email }
    }
  }
`;

// Triggers WP's built-in password reset email via WPGraphQL.
// NOTE: Customize the WP email template to link to /account/password-reset?key=KEY&login=LOGIN
// instead of wp-login.php — add a 'retrieve_password_message' filter in your WP theme/plugin.
export async function requestPasswordResetGql(email: string): Promise<void> {
  await gqlClient.request<any>(SEND_RESET_EMAIL_MUTATION, { username: email });
}

// Token format: "key|login" (both values from the WP reset URL, pipe-separated).
// The reset page reads ?key=KEY&login=LOGIN from the URL and encodes them as "KEY|LOGIN".
export async function resetPasswordGql(token: string, newPassword: string): Promise<void> {
  const separatorIndex = token.indexOf('|');
  if (separatorIndex === -1) throw new Error('Invalid reset token format');
  const key = token.slice(0, separatorIndex);
  const login = token.slice(separatorIndex + 1);
  await gqlClient.request<any>(RESET_PASSWORD_MUTATION, { key, login, password: newPassword });
}
