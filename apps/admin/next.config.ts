import type { NextConfig } from "next";
const config: NextConfig = { output: "standalone", transpilePackages: ["@zorriel/shared"] };
export default config;
