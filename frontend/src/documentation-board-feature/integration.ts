/**
 * DOCUMENTATION_BOARD_FEATURE
 * To remove this feature: delete the `documentation-board-feature` directory, then remove
 * every import/marked block that references DOCUMENTATION_BOARD in App.tsx, Header.tsx,
 * LandingPage.tsx, and index.html (structured data nav list).
 */
export const DOCUMENTATION_BOARD_BASE_PATH = '/docs';

export function documentationBoardArticlePath(slug: string): string {
  return `${DOCUMENTATION_BOARD_BASE_PATH}/${encodeURIComponent(slug)}`;
}
