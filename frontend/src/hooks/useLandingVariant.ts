import { useEffect, useRef, useState } from 'react';
import {
  getLandingVariant,
  isLandingPreviewSearch,
  LANDING_AB_TEST_VERSION,
  type LandingVariant,
} from '../lib/landingAbTest';
import { recordAnalyticsEvent } from '../lib/analyticsEvents';

export type { LandingVariant };

/**
 * Returns the variant and whether this is a preview session.
 *
 * Preview mode is active when `?variant=A` or `?variant=B` is in the URL.
 * In preview mode the variant is taken directly from the query param,
 * localStorage is not written, and no analytics events are fired.
 * This lets the owner visit `/?variant=B` to inspect the page without
 * polluting the conversion data.
 */
function resolveVariant(): { variant: LandingVariant; isPreview: boolean } {
  const search = window.location.search;
  return {
    variant: getLandingVariant(search),
    isPreview: isLandingPreviewSearch(search),
  };
}

/**
 * Assigns and persists an A/B variant for the landing page.
 * Fires an `lp_view` event on every mount so page views are counted accurately.
 * Returns the variant, a preview flag, and a stable `trackCTAClick` function.
 */
export function useLandingVariant(): {
  variant: LandingVariant;
  isPreview: boolean;
  trackCTAClick: () => void;
} {
  const [{ variant, isPreview }] = useState(resolveVariant);
  const variantRef = useRef(variant);
  const isPreviewRef = useRef(isPreview);

  useEffect(() => {
    if (isPreviewRef.current) return;
    recordAnalyticsEvent(
      'lp_view',
      {
        variant: variantRef.current,
        ab_version: LANDING_AB_TEST_VERSION,
        referrer: document.referrer || '',
      },
      { kind: 'guest' },
    );
  }, []);

  const trackCTAClick = () => {
    if (isPreview) return;
    recordAnalyticsEvent(
      'lp_cta_click',
      { variant, ab_version: LANDING_AB_TEST_VERSION },
      { kind: 'guest' },
    );
  };

  return { variant, isPreview, trackCTAClick };
}
