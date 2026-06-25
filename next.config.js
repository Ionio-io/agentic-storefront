/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Mongoose to work correctly in Next.js 14 serverless (Vercel)
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },

  images: {
    remotePatterns: [
      // Shopify product images
      { protocol: "https", hostname: "cdn.shopify.com" },
      // fal.ai generated images (VTO results)
      { protocol: "https", hostname: "v3.fal.media" },
      { protocol: "https", hostname: "fal.media" },
      { protocol: "https", hostname: "**.fal.media" },
      // Google Cloud Storage (fal.ai alternate output bucket)
      { protocol: "https", hostname: "storage.googleapis.com" },
      // Unsplash — used for the sample person photo in VTOWidget
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Expose the Vercel deployment URL to the app at runtime
  env: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
};

module.exports = nextConfig;
