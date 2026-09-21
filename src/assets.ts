// Builds a correct URL for a file in public/, honoring Vite's configured
// base path (see vite.config.ts) instead of a hardcoded "public/..." string,
// which breaks once the app is served from a subpath (e.g. GitHub Pages).
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
