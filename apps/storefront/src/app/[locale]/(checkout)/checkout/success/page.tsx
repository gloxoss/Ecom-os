import { notFound } from 'next/navigation';

export default function SuccessPage(): never {
  // An order ID in a URL does not prove an order or payment succeeded.
  notFound();
}
