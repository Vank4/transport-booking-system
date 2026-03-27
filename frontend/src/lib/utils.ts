import config from '@/config';

/**
 * Resolves a logo path to a full URL.
 * Handles both remote (http/https) and local (/public/uploads/...) paths.
 * Strips /api suffix from base URL if present for static asset resolution.
 */
export const getLogoUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Use wsUrl as the base for static assets (usually port 3000 root)
  const hostUrl = config.wsUrl || "http://localhost:3000";
  return `${hostUrl}/${path.replace(/^\/+/, "")}`;
};
