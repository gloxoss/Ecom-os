import React from 'react';
import { SiteHeaderClient } from './site-header-client';

export function SiteHeader() {
  // As a Server Component, we can fetch dynamic server-side navigation data here if needed in the future.
  // For now, we simply render the interactive client wrapper.
  return <SiteHeaderClient />;
}
