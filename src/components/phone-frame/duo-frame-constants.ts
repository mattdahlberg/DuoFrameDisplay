// Shared geometry for compositing content (video or a static image) inside
// an iPhone Duo frame graphic - used by both DuoVideo and DuoImage so the
// two stay visually identical and only ever need re-measuring in one place.
//
// Unlike a single-screen phone, the Duo has five distinct frame graphics
// rather than one frame per phone model - the device folds, so "which frame"
// really means "which physical state", not an interchangeable alternate. The
// cover state (outer 5.4" display, visible while closed) has three frame
// variants that all share one screen cutout, just drawn at different angles
// and canvas sizes; the inner state (unfolded 7.6" display, visible only
// once open) has two, one per orientation.

export type DuoVariant =
  | 'cover-portrait'
  | 'cover-open'
  | 'cover-landscape'
  | 'inner-landscape'
  | 'inner-portrait';

// Used whenever a placement doesn't name a variant.
export const DEFAULT_VARIANT: DuoVariant = 'cover-portrait';

type ScreenRect = {
  // All values are % of the *frame's* own width/height, except radiusX/Y,
  // which are % of the screen window's width/height. Expressing the radius
  // against the screen (not the frame) is what makes the rounding scale
  // correctly at any render size - inline, or the much larger lightbox.
  top: number;
  left: number;
  width: number;
  height: number;
  radiusX: number;
  radiusY: number;
};

type FrameSpec = {
  src: string;
  width: number;
  height: number;
  // Raw measured cutout, before BLEED/RADIUS_SCALE are applied.
  measured: ScreenRect;
};

// ---------------------------------------------------------------------------
// Measuring a frame's cutout
// ---------------------------------------------------------------------------
// Each frame PNG must have a genuinely transparent screen cutout (alpha),
// not a black or white fill. Measure top/left/width/height from the alpha
// channel at a row/column near the shape's centre (away from any corner),
// not via a naive flood fill from the centre pixel outward - on these
// frames the transparent screen region and the transparent background
// outside the device sit close enough together that a flood fill can
// silently merge the two into one oversized region. Measure the corner
// radius the same way: read the alpha inset at each row moving down from
// the top edge until it reaches the flat side, from a *zoomed crop* of
// the corner rather than a script guess - the cover frames' screen corners
// are nearly square (~1% radius), while the inner frames' are drawn with a
// much more pronounced curve (~5-6% radius); a script that assumes one
// shape for both will get one of the two visibly wrong.
const FRAMES: Record<DuoVariant, FrameSpec> = {
  // Closed, outer 5.4" display facing you. duo-cover-open shares this exact
  // cutout (same size, shifted right on its wider canvas) - it's the same
  // physical screen shown from an angle where the other half of the frame
  // renders the phone's closed-back half instead of background.
  'cover-portrait': {
    src: '/frames/duo-cover-portrait.png',
    width: 516,
    height: 713,
    measured: {
      top: 2.66,
      left: 5.62,
      width: 90.5,
      height: 95.23,
      radiusX: 1.28,
      radiusY: 0.88,
    },
  },
  'cover-open': {
    src: '/frames/duo-cover-open.png',
    width: 1001,
    height: 713,
    measured: {
      top: 2.66,
      left: 51.25,
      width: 46.65,
      height: 95.23,
      radiusX: 1.28,
      radiusY: 0.88,
    },
  },
  'cover-landscape': {
    src: '/frames/duo-cover-landscape.png',
    width: 713,
    height: 517,
    measured: {
      top: 5.61,
      left: 2.1,
      width: 95.23,
      height: 90.33,
      radiusX: 0.88,
      radiusY: 1.28,
    },
  },
  // Open, both halves of the inner 7.6" display combined into one
  // continuous screen (this is how the real device works - unfolded, it's
  // a single display, not two).
  'inner-landscape': {
    src: '/frames/duo-inner-landscape.png',
    width: 999,
    height: 716,
    measured: {
      top: 3.49,
      left: 2.3,
      width: 95.2,
      height: 93.44,
      radiusX: 4.52,
      radiusY: 6.43,
    },
  },
  'inner-portrait': {
    src: '/frames/duo-inner-portrait.png',
    width: 718,
    height: 997,
    measured: {
      top: 2.41,
      left: 3.62,
      width: 93.18,
      height: 95.39,
      radiusX: 6.43,
      radiusY: 4.52,
    },
  },
};

// Bleed the content window a hair past the measured edges so it tucks under
// the frame's opaque bezel instead of landing exactly flush with it -
// browsers round percentage-based CSS to device pixels independently per
// edge, which can leave a hairline gap at the true edge (invisible in dark
// mode, visible in light mode) even with an accurate measurement. This only
// ever crops a sliver more via object-cover, never stretches/distorts the
// content. Set to 0 to fall back to the raw measured edges.
const BLEED = 0.4;

// The frame's corner is a continuous-curvature "squircle" (same family as
// iOS app icons), not a true circular/elliptical arc - the only shape CSS
// border-radius can draw. A radius that exactly matches the squircle's
// reach still leaves a sliver of gap right at the diagonal, since the two
// curves have different shapes. Scaling the radius down pulls the content's
// corner back to tuck under the squircle instead of poking past it. Tune
// this (0-1) if corners still show a gap, or start clipping too early.
const RADIUS_SCALE = 0.7;

export type ResolvedFrame = {
  src: string;
  width: number;
  height: number;
  screen: ScreenRect;
};

export function getDuoFrame(variant: DuoVariant = DEFAULT_VARIANT): ResolvedFrame {
  const frame = FRAMES[variant] ?? FRAMES[DEFAULT_VARIANT];
  const m = frame.measured;

  return {
    src: frame.src,
    width: frame.width,
    height: frame.height,
    screen: {
      top: m.top - BLEED,
      left: m.left - BLEED,
      width: m.width + BLEED * 2,
      height: m.height + BLEED * 2,
      radiusX: m.radiusX * RADIUS_SCALE,
      radiusY: m.radiusY * RADIUS_SCALE,
    },
  };
}

export const DUO_VARIANTS = Object.keys(FRAMES) as DuoVariant[];

// Whether the lightbox opens to the exact crop shown inline (true) or always
// to the full, uncropped phone regardless of zoom/focus (false).
export const LIGHTBOX_MATCHES_CROP = true;

export type FrameFocus = 'top' | 'center' | 'bottom';

// A tighter zoom shows less of the frame in a box of the same width, which
// reads as *smaller* on the page - counter to the point of zooming in. Scale
// the rendered width up alongside zoom so a closer crop also appears larger.
// sqrt keeps that growth from compounding with the crop's own height loss
// (which is linear in zoom) into something that blows up the layout at high
// zoom values. zoom={1} (the default) is unaffected - width stays exactly
// what was passed in.
export function computeDisplayWidth(width: number, zoom: number) {
  return width * Math.sqrt(zoom);
}

// The zoom/focus crop math shared by every placement: 1 = full frame
// visible; 2+ zooms in and clips to roughly a 1/zoom-height slice, with
// `focus` choosing which slice stays in view. Orientation-agnostic - works
// the same for the landscape variants as the portrait ones, since it only
// ever operates on the frame's own width/height ratio.
export function computeFrameLayout(
  width: number,
  zoom: number,
  focus: FrameFocus,
  frameWidth: number,
  frameHeight: number,
) {
  // Full, un-cropped size of the frame at this width.
  const phoneHeight = (width / frameWidth) * frameHeight;
  // The visible window shrinks as zoom increases - this is what gets clipped.
  const viewportHeight = phoneHeight / zoom;
  const hiddenHeight = phoneHeight - viewportHeight;
  const offsetY =
    focus === 'top' ? 0 : focus === 'bottom' ? -hiddenHeight : -hiddenHeight / 2;

  // Same crop, expressed as % of the cropped viewport rather than px, so it
  // still applies correctly at whatever size the lightbox renders at.
  const heightPercent = zoom * 100;
  const hiddenPercent = heightPercent - 100;
  const offsetYPercent =
    focus === 'top' ? 0 : focus === 'bottom' ? -hiddenPercent : -hiddenPercent / 2;

  return { phoneHeight, viewportHeight, offsetY, heightPercent, offsetYPercent };
}
