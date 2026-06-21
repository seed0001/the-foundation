import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Next doesn't pick up an unrelated lockfile
  // elsewhere on the machine when inferring the project root.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
