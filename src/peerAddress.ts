import { isIP } from 'node:net';

const REQUIRED_PORT = 18018;

const toNormalizedHost = (host: string) => {
  const trimmed = host.trim().toLowerCase();
  return trimmed.startsWith('[') && trimmed.endsWith(']')
    ? trimmed.slice(1, -1)
    : trimmed;
};

const ipv4ToNumber = (ip: string) => {
  const parts = ip.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  const [a, b, c, d] = parts as [number, number, number, number];
  return ((a << 24) >>> 0) + (b << 16) + (c << 8) + d;
};

const inRange = (value: number, start: number, end: number) => value >= start && value <= end;

const isPrivateIpv4 = (ip: string) => {
  const value = ipv4ToNumber(ip);
  if (value === null) return false;

  return (
    inRange(value, ipv4ToNumber('0.0.0.0')!, ipv4ToNumber('0.255.255.255')!) ||
    inRange(value, ipv4ToNumber('10.0.0.0')!, ipv4ToNumber('10.255.255.255')!) ||
    inRange(value, ipv4ToNumber('100.64.0.0')!, ipv4ToNumber('100.127.255.255')!) ||
    inRange(value, ipv4ToNumber('127.0.0.0')!, ipv4ToNumber('127.255.255.255')!) ||
    inRange(value, ipv4ToNumber('169.254.0.0')!, ipv4ToNumber('169.254.255.255')!) ||
    inRange(value, ipv4ToNumber('172.16.0.0')!, ipv4ToNumber('172.31.255.255')!) ||
    inRange(value, ipv4ToNumber('192.0.0.0')!, ipv4ToNumber('192.0.0.255')!) ||
    inRange(value, ipv4ToNumber('192.0.2.0')!, ipv4ToNumber('192.0.2.255')!) ||
    inRange(value, ipv4ToNumber('192.168.0.0')!, ipv4ToNumber('192.168.255.255')!) ||
    inRange(value, ipv4ToNumber('198.18.0.0')!, ipv4ToNumber('198.19.255.255')!) ||
    inRange(value, ipv4ToNumber('198.51.100.0')!, ipv4ToNumber('198.51.100.255')!) ||
    inRange(value, ipv4ToNumber('203.0.113.0')!, ipv4ToNumber('203.0.113.255')!) ||
    inRange(value, ipv4ToNumber('224.0.0.0')!, ipv4ToNumber('255.255.255.255')!)
  );
};

const isPrivateIpv6 = (ip: string) => {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fe80::') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
  );
};

export const parsePeerAddress = (peerAddress: string) => {
  const index = peerAddress.lastIndexOf(':');
  if (index === -1) return null;

  const host = peerAddress.slice(0, index).trim();
  const port = Number(peerAddress.slice(index + 1));

  if (!host || !Number.isInteger(port)) return null;

  return { host, port };
};

export const isAllowedPeerAddress = (peerAddress: string, requiredPort: number = REQUIRED_PORT) => {
  const parsed = parsePeerAddress(peerAddress);
  if (!parsed || parsed.port !== requiredPort) return false;

  const host = toNormalizedHost(parsed.host);
  if (!host) return false;

  if (host === 'localhost' || host === 'localhost.localdomain' || host.endsWith('.localhost')) {
    return false;
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4) return !isPrivateIpv4(host);
  if (ipVersion === 6) return !isPrivateIpv6(host);

  return true;
};

export const filterAllowedPeerAddresses = (peerAddresses: Iterable<string>, requiredPort: number = REQUIRED_PORT) => {
  const allowed = new Set<string>();
  for (const peerAddress of peerAddresses) {
    const trimmed = (peerAddress ?? '').trim();
    if (trimmed.length === 0) continue;
    if (isAllowedPeerAddress(trimmed, requiredPort)) allowed.add(trimmed);
  }
  return allowed;
};
