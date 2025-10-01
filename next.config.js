/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/protected/dashboard',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
