export const VOXY_CANONICAL_HEAD_ALPHA_SCHEMA_VERSION =
  "voxy-canonical-head-alpha-v1" as const;

export const VOXY_CANONICAL_HEAD_ALPHA = {
  source: {
    repositoryPath:
      "apps/web/public/brands/voxy/references/derived/CANON-04-pocket-clean.png",
    sha256:
      "5176f19d3de18a34c32c908d93a3277a2715959d491620d21c7129f9d305f5ca",
    nativeWidth: 1672,
    nativeHeight: 941,
    alphaMinimum: 255,
    alphaMaximum: 255,
    containsTransparency: false,
  },
  rigBounds: { x: 495, y: 55, width: 500, height: 400 },
  acceptedMotionSourceInRig: {
    // Preserve the human-accepted Motion-v4 head/face registration exactly.
    // Structural alpha separation, not a face-position change, fixes the body leak.
    x: -547.875,
    y: -84.515,
    width: 2064,
    height: 1161,
  },
  canonicalStageDelta: { x: 37.125, y: 4.125 },
  faceRigOffset: { x: 0, y: 0 },
  contributionBounds: { x: 44, y: 15, width: 456, height: 374 },
  maskUnits: "userSpaceOnUse",
  maskType: "alpha",
  outsideSilhouetteContribution: 0,
  includes: [
    "speech-bubble-head",
    "speech-bubble-tail",
    "left-headphone",
    "right-headphone",
    "headphone-band",
  ],
  excludes: [
    "background",
    "neck",
    "left-shoulder",
    "right-shoulder",
    "left-lapel",
    "right-lapel",
    "torso",
    "vog-pin",
    "microphone",
  ],
} as const;

export function renderVoxyCanonicalHeadAlphaShape(color: string): string {
  return `<path d="M157 23C140 22 129 29 124 45C120 61 119 83 119 111V276C119 301 130 314 154 317L194 319V373C194 386 204 389 214 379L266 328L439 337C466 338 482 326 487 301C493 266 494 188 489 153C486 130 474 110 455 95C450 91 445 89 438 89L343 82C335 81 330 77 325 70L302 35C298 29 291 28 282 28Z" fill="${color}"/>
    <path d="M282 28C348 30 424 35 453 48C476 59 490 86 497 122L489 158C484 133 473 111 455 95C450 91 445 89 438 89L343 82C335 81 330 77 325 70L302 35C298 29 291 28 282 28Z" fill="${color}"/>
    <path d="M157 23C129 24 100 48 87 80C79 99 76 120 77 141" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
    <path d="M80 113C64 110 54 123 50 145C44 178 46 236 54 263C60 283 73 292 88 286C102 281 111 266 113 244L114 155C112 131 99 116 80 113Z" fill="${color}"/>
    <path d="M486 119C496 118 500 122 500 128V285C499 290 495 293 488 292Z" fill="${color}"/>`;
}

export function validateVoxyCanonicalHeadAlpha(): string[] {
  const errors: string[] = [];
  if (
    VOXY_CANONICAL_HEAD_ALPHA.source.containsTransparency !== false ||
    VOXY_CANONICAL_HEAD_ALPHA.source.alphaMinimum !== 255 ||
    VOXY_CANONICAL_HEAD_ALPHA.source.alphaMaximum !== 255
  ) {
    errors.push("flattened_source_alpha_audit_invalid");
  }
  if (
    VOXY_CANONICAL_HEAD_ALPHA.outsideSilhouetteContribution !== 0 ||
    VOXY_CANONICAL_HEAD_ALPHA.maskUnits !== "userSpaceOnUse" ||
    VOXY_CANONICAL_HEAD_ALPHA.maskType !== "alpha"
  ) {
    errors.push("head_alpha_contract_invalid");
  }
  if (
    VOXY_CANONICAL_HEAD_ALPHA.acceptedMotionSourceInRig.x !== -547.875 ||
    VOXY_CANONICAL_HEAD_ALPHA.acceptedMotionSourceInRig.y !== -84.515 ||
    VOXY_CANONICAL_HEAD_ALPHA.faceRigOffset.x !== 0 ||
    VOXY_CANONICAL_HEAD_ALPHA.faceRigOffset.y !== 0
  ) {
    errors.push("head_source_registration_invalid");
  }
  for (const forbidden of [
    "left-shoulder",
    "right-shoulder",
    "left-lapel",
    "right-lapel",
    "neck",
    "torso",
    "vog-pin",
    "microphone",
  ] as const) {
    if (!VOXY_CANONICAL_HEAD_ALPHA.excludes.includes(forbidden)) {
      errors.push(`head_alpha_exclusion_missing:${forbidden}`);
    }
  }
  return errors;
}
