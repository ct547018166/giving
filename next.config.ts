import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['localhost', '127.0.0.1', '172.20.10.3'],

  // 图片优化配置
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1年
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'thirdwx.qlogo.cn',
      },
      {
        protocol: 'https',
        hostname: 'wx.qlogo.cn',
      }
    ],
  },

  // 压缩和优化
  compress: true,

  // 禁用X-Powered-By头
  poweredByHeader: false,

  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
};

export default nextConfig;
