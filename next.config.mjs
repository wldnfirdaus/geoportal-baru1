/** @type {import('next').NextConfig} */
const nextConfig = {
 basePath: '/portal',
  /* config options here */
  env: {
    CESIUM_ION_TOKEN: process.env.CESIUM_ION_TOKEN
  }
};

export default nextConfig;
