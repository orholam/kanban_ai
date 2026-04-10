/**
 * Landing page A/B experiment version. Bump this when you materially change
 * variant A or B (copy, layout, pricing section, etc.) so analytics stay
 * comparable within one experiment. Events store `ab_version` in metadata;
 * the dashboard only aggregates rows matching {@link LANDING_AB_TEST_VERSION}.
 *
 * Events recorded before `ab_version` existed are treated as version `"1"`
 * for filtering so the first version after this feature ships stays consistent.
 */
export const LANDING_AB_TEST_VERSION = '9';

/**
 * True when the URL requests a landing preview (`?variant=A` or `?variant=B`, exact case).
 * Used by the router so logged-in users can open `/` with this query without being sent to /kanban.
 */
export function isLandingPreviewSearch(search: string): boolean {
  const v = new URLSearchParams(search).get('variant');
  return v === 'A' || v === 'B';
}

/** Pre-metadata rows and first tagged release — keep in sync with historical defaults. */
const UNTAGGED_LANDING_AB_VERSION = '1';

export function landingAbVersionFromMetadata(metadata: Record<string, unknown> | undefined): string {
  const v = metadata?.ab_version;
  if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  return UNTAGGED_LANDING_AB_VERSION;
}
