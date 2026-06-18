/**
 * Canonical company data — single source of truth.
 * Import from this file everywhere instead of hardcoding strings.
 */

export const COMPANY = {
  name: "Golden Dream Draw",
  email: "contact@goldendreamdraw.uk",
  siteUrl: "https://goldendreamdraw.uk",
} as const;

export const ADDRESS = {
  line1: "Golden Dream Draw",
  line2: "PO Box 483, Green Lanes",
  line3: "London, N13 4FG",
  line4: "United Kingdom",
  /** Single-line format for inline use */
  inline: "Golden Dream Draw, PO Box 483, Green Lanes, London, N13 4FG, United Kingdom",
} as const;
