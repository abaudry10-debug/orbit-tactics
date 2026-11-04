// Complète app.json. EXPO_BASE_URL est défini uniquement lors du build web
// pour GitHub Pages (le site est servi sous /orbit-tactics).
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments || {}),
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
