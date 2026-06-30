/** @type {import('next').NextConfig} */
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8091/api";

const patterns = [
  { protocol: "http", hostname: "localhost" },
  { protocol: "http", hostname: "backend" },
];

try {
  const u = new URL(apiBase);
  // Allow images served from the backend origin (e.g. http://localhost:8091/media/**)
  patterns.push({
    protocol: u.protocol.replace(":", ""),
    hostname: u.hostname,
    port: u.port || undefined,
  });
} catch (e) {}

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: patterns,
  },
};

module.exports = nextConfig;
