import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.instagram.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.instagram.com https://*.cdninstagram.com",
      "media-src 'self' blob: https://res.cloudinary.com https://interactive-examples.mdn.mozilla.net",
      "frame-src 'self' https://www.linkedin.com https://www.instagram.com https://res.cloudinary.com",
      "connect-src 'self' https://res.cloudinary.com",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" }
        ]
      },
      {
        source: "/",
        headers: noStoreHeaders()
      },
      {
        source: "/:path(about|contact|projects|internships|social|news|certifications|solutions)",
        headers: noStoreHeaders()
      },
      {
        source: "/:path(about|contact|projects|internships|social|news|certifications|solutions)/:slug*",
        headers: noStoreHeaders()
      },
      {
        source: "/admin/:path*",
        headers: noStoreHeaders()
      },
      {
        source: "/api/:path*",
        headers: noStoreHeaders()
      }
    ];
  }
};

function noStoreHeaders() {
  return [
    { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
    { key: "Pragma", value: "no-cache" },
    { key: "Expires", value: "0" }
  ];
}

export default nextConfig;
