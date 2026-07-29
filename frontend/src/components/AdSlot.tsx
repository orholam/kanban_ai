import { useCallback } from 'react';

const AD_CONTAINER_ATTR = 'ta-ad-container';

interface AdSlotProps {
  /** Extra spacing/width classes for the surrounding layout. */
  className?: string;
}

/**
 * Marks a spot where TinyAdz may inject an inline banner.
 *
 * TinyAdz only auto-places ads against CSS selectors it scraped from the
 * marketing landing page, so pages without those exact class chains get no
 * inventory. An explicit container opts any page in.
 *
 * The attribute has to be present the moment the node lands in the DOM: TinyAdz
 * discovers new containers from a MutationObserver callback, which runs before
 * React effects would get a chance to add it. A ref callback fires during commit
 * and beats that microtask.
 */
export default function AdSlot({ className = '' }: AdSlotProps) {
  const attachMarker = useCallback((node: HTMLDivElement | null) => {
    node?.setAttribute(AD_CONTAINER_ATTR, 'true');
  }, []);

  return (
    <div
      ref={attachMarker}
      // Their slot builder skips containers narrower than 250px.
      className={`min-w-[250px] empty:hidden ${className}`.trim()}
    />
  );
}
