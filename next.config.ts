import type { NextConfig } from "next";
import os from "node:os";

/**
 * Next dev blocks cross-origin fetches to `/_next/*` unless the request Origin
 * hostname is allowlisted. Loading the app via a LAN IP (e.g. http://192.168.1.5:3000)
 * sends Origin with that IP; `localhost` alone is not enough.
 * We add this machine's non-loopback IPv4 addresses at config load time.
 * Optional: NEXT_ALLOWED_DEV_ORIGINS=host1,host2 (e.g. a Tailscale hostname).
 */
function isLanIPv4(
  family: string | number | undefined,
  internal: boolean | undefined,
): boolean {
  if (internal) return false;
  return family === "IPv4" || family === 4;
}

function discoveredLanDevOrigins(): string[] {
  const hosts = new Set<string>();
  for (const list of Object.values(os.networkInterfaces() ?? {})) {
    for (const addr of list ?? []) {
      if (addr && isLanIPv4(addr.family, addr.internal)) {
        hosts.add(addr.address);
      }
    }
  }
  return [...hosts];
}

function envExtraDevOrigins(): string[] {
  const raw = process.env.NEXT_ALLOWED_DEV_ORIGINS;
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [...discoveredLanDevOrigins(), ...envExtraDevOrigins()],
};

export default nextConfig;
