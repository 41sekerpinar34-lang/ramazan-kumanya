/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Uyarıları hata olarak görüp yayını durdurma
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript hatalarını görmezden gel (JS kullanıyoruz ama yine de ekleyelim)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;