'use client';

import { useState } from 'react';
import { contactAction } from '@/lib/mock-actions';

type FieldKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'message';

interface ContactFormClientProps {
  fields: Record<FieldKey, string>;
  placeholders: Record<FieldKey, string>;
  submitLabel: string;
  successMessage: string;
  errorMessage: string;
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-300';

export function ContactFormClient({ fields, placeholders, submitLabel, successMessage, errorMessage }: ContactFormClientProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(formData: FormData) {
    setStatus('submitting');
    const result = await contactAction(formData);
    setStatus(result.ok ? 'success' : 'error');
  }

  if (status === 'success') {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-center">
        <p className="font-body text-base text-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="firstName" required placeholder={placeholders.firstName} aria-label={fields.firstName} className={inputClass} />
        <input name="lastName" required placeholder={placeholders.lastName} aria-label={fields.lastName} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="email" name="email" required placeholder={placeholders.email} aria-label={fields.email} className={inputClass} />
        <input type="tel" name="phone" placeholder={placeholders.phone} aria-label={fields.phone} className={inputClass} />
      </div>
      <textarea name="message" required rows={4} placeholder={placeholders.message} aria-label={fields.message} className={`${inputClass} resize-none`} />

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-4 font-body text-[11px] font-medium uppercase tracking-[0.25em] text-background transition-colors duration-300 hover:bg-primary disabled:opacity-60"
      >
        {status === 'submitting' ? '…' : submitLabel}
      </button>

      {status === 'error' && <p className="font-body text-sm text-destructive">{errorMessage}</p>}
    </form>
  );
}
