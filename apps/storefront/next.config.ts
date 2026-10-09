import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isStatic = process.env.ECOM_DEPLOY_MODE === 'static';
const isDev = process.env.NODE_ENV === 'development';

const baseConfig: NextConfig = {
  poweredByHeader: false,
  output: isStatic ? 'export' : undefined,
  transpilePackages: [
    '@ecom-os/addons-i18n',
    '@ecom-os/addons-multi-payment',
    '@ecom-os/brand-config',
    '@ecom-os/engine',
    '@ecom-os/engine-woocommerce'
  ],
  images: {
    unoptimized: isDev || isStatic,
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
      // Local WordPress dev instance — covers all /wp-content/uploads/... paths
      { protocol: 'http', hostname: 'cms-ecom-os.local', pathname: '/**' },
    ],
  },
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: '/wp-admin/:path*',
        destination: 'http://cms-ecom-os.local/wp-admin/:path*',
      },
      {
        source: '/wp-login.php',
        destination: 'http://cms-ecom-os.local/wp-login.php',
      },
      {
        source: '/wp-content/:path*',
        destination: 'http://cms-ecom-os.local/wp-content/:path*',
      },
      {
        source: '/wp-includes/:path*',
        destination: 'http://cms-ecom-os.local/wp-includes/:path*',
      }
    ];
  },
};

// next-intl v3.26.x injects experimental.turbo.resolveAlias when Turbopack
// is active, but Next.js 16 moved that config to top-level `turbopack`.
// We patch the output before Next.js validates it.
function withFixedTurbopack(config: NextConfig): NextConfig {
  const c = config as NextConfig & {
    experimental?: { turbo?: { resolveAlias?: Record<string, string> } };
    turbopack?: { resolveAlias?: Record<string, string> };
  };

  if (c.experimental?.turbo) {
    c.turbopack = {
      ...c.turbopack,
      resolveAlias: {
        ...c.turbopack?.resolveAlias,
        ...c.experimental.turbo.resolveAlias,
      },
    };
    delete c.experimental.turbo;
    if (Object.keys(c.experimental).length === 0) {
      delete c.experimental;
    }
  }

  return c;
}

export default withFixedTurbopack(withNextIntl(baseConfig));
