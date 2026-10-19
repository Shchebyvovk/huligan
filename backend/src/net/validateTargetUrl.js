import { isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

// IPv4 ranges a load-test target must never resolve to: loopback, RFC1918
// private space, link-local (incl. the 169.254.169.254 cloud metadata
// endpoint), CGNAT, documentation/benchmark blocks, multicast, reserved.
// A targetUrl is attacker-controlled input (admin-typed or, before the CORS
// fix, CSRF-riden) that the orchestrator actually connects to — without this
// list it's a textbook SSRF into whatever internal network the backend runs on.
const IPV4_BLOCKED_RANGES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function ipv4ToInt(ip) {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isBlockedIpv4(ip) {
  const n = ipv4ToInt(ip);
  return IPV4_BLOCKED_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (n & mask) === (ipv4ToInt(base) & mask);
  });
}

// IPv6: ::1 (loopback), :: (unspecified), fc00::/7 (unique local),
// fe80::/10 (link-local) — covers the realistic internal-network cases
// without a full IPv6 CIDR library. ::ffff:a.b.c.d (IPv4-mapped) is
// unwrapped and re-checked against the IPv4 rules above.
function isBlockedIpv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;

  const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(normalized);
  if (mapped) return isBlockedIpv4(mapped[1]);

  const firstHextet = normalized.split(":")[0];
  if (/^fc[0-9a-f]{2}$/.test(firstHextet) || /^fd[0-9a-f]{2}$/.test(firstHextet)) return true; // fc00::/7
  if (firstHextet === "fe80" || firstHextet.startsWith("fe8") || firstHextet.startsWith("fe9")
    || firstHextet.startsWith("fea") || firstHextet.startsWith("feb")) return true; // fe80::/10
  return false;
}

export function isBlockedAddress(ip) {
  const version = isIP(ip);
  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);
  return true; // not a parseable IP at all -> fail closed
}

// Validates a load-test target: http(s) only, and must not resolve to any
// internal/private/loopback/link-local address. `resolveHost` is injectable
// (defaults to real DNS) so callers can test rebinding-style hostnames
// without a real network lookup — same DI pattern as the db adapter.
export async function validateTargetUrl(rawUrl, { resolveHost } = {}) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl));
  } catch {
    return { ok: false, reason: "targetUrl не є коректним URL" };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: "targetUrl має бути http або https" };
  }

  const hostname = parsed.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return { ok: false, reason: "targetUrl не може вказувати на localhost" };
  }

  const literalVersion = isIP(hostname);
  if (literalVersion) {
    if (isBlockedAddress(hostname)) {
      return { ok: false, reason: "targetUrl вказує на приватну/внутрішню адресу" };
    }
    return { ok: true };
  }

  const lookup = resolveHost ?? (async (host) => (await dnsLookup(host, { all: true })).map((a) => a.address));
  let addresses;
  try {
    addresses = await lookup(hostname);
  } catch {
    return { ok: false, reason: "Не вдалось визначити адресу хоста targetUrl" };
  }
  if (!addresses || addresses.length === 0) {
    return { ok: false, reason: "Не вдалось визначити адресу хоста targetUrl" };
  }
  if (addresses.some((ip) => isBlockedAddress(ip))) {
    return { ok: false, reason: "targetUrl вказує на приватну/внутрішню адресу" };
  }
  return { ok: true };
}
