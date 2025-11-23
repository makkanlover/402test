import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // サーバー外部パッケージの設定
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "libsql",
  ],
};

export default nextConfig;
