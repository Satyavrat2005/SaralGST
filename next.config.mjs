/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // pdf-parse uses pdfjs-dist which crashes when webpack tries to bundle it.
  // This tells Next.js to load it natively in Node.js instead.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;
