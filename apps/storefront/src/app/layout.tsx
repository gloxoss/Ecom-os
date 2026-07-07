import './globals.css';
import '@/styles/theme-vars.css';
import { Inter } from 'next/font/google';
import { initAddons } from '@/lib/addons';
import { TailwindIndicator } from '@/components/tailwind-indicator';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });

initAddons({ engineType: process.env.ECOM_ENGINE ?? 'fake' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
        <TailwindIndicator />
      </body>
    </html>
  );
}
