import type { NextConfig } from "next";

const nextConfig = {
  // Docker 배포를 위한 standalone 출력 설정
  output: 'standalone',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;