import './globals.css';
import '@/styles/theme-vars.css';
import localFont from 'next/font/local';
import { initAddons } from '@/lib/addons';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { validateRuntimeConfig } from '@/lib/runtime-config';

export const dynamic = 'force-dynamic';

validateRuntimeConfig();

const sentient = localFont({ src: '../fonts/Sentient-Variable.ttf', variable: '--font-sentient', display: 'swap' });
const interTight = localFont({ src: '../fonts/InterTight-Variable.ttf', variable: '--font-inter-tight', display: 'swap' });

initAddons({ engineType: process.env.ECOM_ENGINE ?? 'fake' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sentient.variable} ${interTight.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
        <TailwindIndicator />
      </body>
    </html>
  );
}
