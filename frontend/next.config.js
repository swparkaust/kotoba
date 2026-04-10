const withPWA = require("next-pwa")({
  dest: "public",
  register: false,
  skipWaiting: true,
  sw: "/sw.js",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  turbopack: {},
});
