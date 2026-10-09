import type { Customer, AuthSession, LoginInput, RegisterInput, Order } from '@ecom-os/engine';

export function requireCustomerAccounts(): never {
  throw new Error('Customer accounts are unavailable pending a verified authentication addon.');
}

// A browser token must never select a customer for privileged REST requests.
export async function getCustomerByToken(_token: string): Promise<Customer | null> { return null; }
export async function loginGql(_input: LoginInput): Promise<AuthSession> { return requireCustomerAccounts(); }
export async function registerRest(_input: RegisterInput): Promise<AuthSession> { return requireCustomerAccounts(); }
export async function getCustomerOrdersRest(_customerId: string): Promise<Order[]> { return requireCustomerAccounts(); }
export async function listAddressesRest(_customerId: string): Promise<any[]> { return requireCustomerAccounts(); }
export async function updateAddressRest(_customerId: string, _addressId: string, _input: any): Promise<any> { return requireCustomerAccounts(); }
export async function createAddressRest(_customerId: string, _input: any): Promise<any> { return requireCustomerAccounts(); }
export async function deleteAddressRest(_customerId: string, _addressId: string): Promise<void> { requireCustomerAccounts(); }
export async function requestPasswordResetGql(_email: string): Promise<void> { requireCustomerAccounts(); }
export async function resetPasswordGql(_token: string, _newPassword: string): Promise<void> { requireCustomerAccounts(); }
