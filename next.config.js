/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['iyzipay'],
  },
  async headers() {
    // Yalnızca geliştirmede: mobil uygulamanın web önizlemesi (Expo, :8081) başka
    // porttan çağırdığı için CORS izni gerekir. Telefondaki uygulama CORS'a tabi
    // değildir; canlıda bu başlıklar eklenmez. API yalnızca Bearer token kabul eder (çerez yok).
    if (process.env.NODE_ENV === 'production') return [];
    return [
      {
        source: '/api/mobile/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
          { key: 'Access-Control-Max-Age', value: '600' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
