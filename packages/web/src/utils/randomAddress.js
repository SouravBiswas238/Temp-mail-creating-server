const ADJECTIVES = [
  "swift", "quiet", "brave", "calm", "eager", "gentle", "happy", "lively",
  "mellow", "nimble", "proud", "quick", "sunny", "witty", "zesty", "bold",
];
const NOUNS = [
  "otter", "falcon", "maple", "river", "comet", "willow", "harbor", "ember",
  "pixel", "meadow", "beacon", "cedar", "quartz", "ripple", "summit", "lynx",
];

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export function generateLocalPart() {
  const adjective = ADJECTIVES[randomInt(ADJECTIVES.length)];
  const noun = NOUNS[randomInt(NOUNS.length)];
  const digits = String(randomInt(100000)).padStart(5, "0");
  return `${adjective}${noun}${digits}`;
}

export function generateAddress(domain) {
  return `${generateLocalPart()}@${domain}`;
}

const MAX_LOCAL_PART_LENGTH = 64;

// Mirrors the local-part rules the SMTP receiver/API accept
// (packages/shared/src/domainConfig.js) so a custom prefix the user types
// here never gets silently rejected server-side.
export function sanitizeLocalPart(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, MAX_LOCAL_PART_LENGTH);
}
