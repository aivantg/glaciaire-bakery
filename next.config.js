/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" bundles only the files needed to run the server.
  // This produces a much smaller Docker image and is the recommended
  // mode for containerised / Dokku deployments.
  output: "standalone",
};

module.exports = nextConfig;
