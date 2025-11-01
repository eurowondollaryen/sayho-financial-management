const os = require("os");
const { execSync } = require("child_process");

const LINK_LOCAL_PREFIX = "169.254.";

const PRIVATE_IP_RANK = [
  { test: (ip) => ip.startsWith("192.168."), rank: 1 },
  { test: (ip) => ip.startsWith("10."), rank: 2 },
  {
    test: (ip) => {
      if (!ip.startsWith("172.")) {
        return false;
      }
      const [, secondOctet] = ip.split(".");
      const parsed = Number(secondOctet);
      return Number.isInteger(parsed) && parsed >= 16 && parsed <= 31;
    },
    rank: 3,
  },
];

const FALLBACK_RANK = 50;

function isValidIpv4(address) {
  const octets = address.split(".");
  if (octets.length !== 4) {
    return false;
  }
  return octets.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }
    const value = Number(part);
    return value >= 0 && value <= 255;
  });
}

function getRank(address) {
  if (!address || !isValidIpv4(address) || address.startsWith(LINK_LOCAL_PREFIX)) {
    return Number.MAX_SAFE_INTEGER;
  }
  const match = PRIVATE_IP_RANK.find((entry) => entry.test(address));
  if (match) {
    return match.rank;
  }
  return FALLBACK_RANK;
}

function isWsl() {
  if (process.platform !== "linux") {
    return false;
  }
  if (process.env.WSL_DISTRO_NAME) {
    return true;
  }
  const release = os.release().toLowerCase();
  return release.includes("microsoft");
}

function getWindowsHostCandidates() {
  try {
    const command =
      "powershell.exe -NoProfile -Command \"Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \\$_.IPAddress -notmatch '^169\\.254\\.' -and \\$_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress\"";
    const output = execSync(command, { encoding: "utf8" });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter(isValidIpv4);
  } catch (error) {
    return [];
  }
}

function getLocalInterfaceCandidates() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  Object.values(interfaces).forEach((networkInterface = []) => {
    networkInterface.forEach((detail) => {
      if (detail.family !== "IPv4" || detail.internal) {
        return;
      }
      const address = detail.address;
      if (isValidIpv4(address) && !addresses.includes(address)) {
        addresses.push(address);
      }
    });
  });

  return addresses;
}

function dedupe(addresses) {
  return [...new Set(addresses)];
}

function resolveFromEnv() {
  const candidates = [
    process.env.DEV_SERVER_HOST,
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME,
    process.env.EXPO_DEV_SERVER_HOST,
  ];
  const resolved = candidates.find((value) => value && value.trim().length > 0);
  return resolved ? resolved.trim() : null;
}

function pickBestAddress(candidates) {
  return candidates
    .map((address) => ({ address, rank: getRank(address) }))
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.address)[0] ?? null;
}

function getDevHost() {
  const forced = resolveFromEnv();
  if (forced) {
    return forced;
  }

  const candidates = [];

  if (isWsl()) {
    candidates.push(...getWindowsHostCandidates());
  }

  candidates.push(...getLocalInterfaceCandidates());

  const uniqueCandidates = dedupe(candidates);

  if (uniqueCandidates.length === 0) {
    return null;
  }

  return pickBestAddress(uniqueCandidates);
}

module.exports = { getDevHost };
