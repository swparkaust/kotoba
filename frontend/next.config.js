const withPWA = require("next-pwa")({
  dest: "public",
  register: false,
  skipWaiting: true,
  sw: "/sw.js",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.RAILS_API_URL || "http://localhost:3000"}/api/v1/:path*`,
      },
    ];
  },
});
