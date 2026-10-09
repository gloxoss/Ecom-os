import type { PaymentGateway } from '../../interface';

export const CmiGateway: PaymentGateway = {
  id: 'cmi',
  name: 'CMI (3D Secure)',
  async initiate() { throw new Error('CMI is unavailable pending certified integration.'); },
  async confirm() { return { success: false, orderId: '' }; },
  async refund() { return { success: false }; },
};
