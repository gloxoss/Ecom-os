'use server';
// MOCK — replaced by real server actions at merge.
export async function checkoutAction(formData: FormData) {
  await new Promise((r) => setTimeout(r, 800));      // let loading states be designed
  return { ok: true, orderId: 'MOCK-1001' };
}
export async function loginAction(_formData: FormData) {
  return { ok: true };
}
export async function contactAction(_formData: FormData) {
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true };
}
