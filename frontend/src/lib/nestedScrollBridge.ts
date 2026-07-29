/**
 * Every route renders inside a nested `overflow-y-auto` element, so `window`
 * never emits a scroll event and `window.scrollY` stays 0.
 *
 * Third-party scripts that treat a window scroll as their "this is a real
 * visitor" signal therefore never activate. TinyAdz gates *all* ad rendering
 * behind a window scroll, a mousemove, or a touchmove, which meant wheel-only
 * readers saw no ads at all. Re-broadcasting nested scrolls onto the window
 * restores that signal.
 */

const THROTTLE_MS = 200;

let installed = false;
let lastForwardedAt = 0;
let forwarding = false;

function forwardNestedScroll(event: Event): void {
  if (forwarding) return;

  // Document-level scrolls already reach window listeners on their own.
  if (event.target === document || event.target === window) return;

  const now = Date.now();
  if (now - lastForwardedAt < THROTTLE_MS) return;
  lastForwardedAt = now;

  forwarding = true;
  try {
    window.dispatchEvent(new Event('scroll'));
  } finally {
    forwarding = false;
  }
}

export function installNestedScrollBridge(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Scroll events do not bubble, but ancestors still observe them while
  // capturing, so one document-level listener covers every scroll container.
  document.addEventListener('scroll', forwardNestedScroll, {
    capture: true,
    passive: true,
  });
}
