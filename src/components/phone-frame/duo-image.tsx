'use client';

import Image from 'next/image';

import {
  computeDisplayWidth,
  computeFrameLayout,
  DEFAULT_VARIANT,
  getDuoFrame,
  LIGHTBOX_MATCHES_CROP,
  screenBorderRadius,
  type DuoVariant,
} from '@/components/phone-frame/duo-frame-constants';
import { useLightboxTrigger } from '@/components/phone-frame/page-lightbox';
import { cn } from '@/lib/utils';

type DuoImageProps = {
  src: string;
  // Shown in the lightbox caption when the framed view is opened full size,
  // and used as the image's alt text.
  caption?: string;

  // --- Adjust these per placement, everything else can stay put ---

  // Which physical state to composite into - see DUO_VARIANTS for the full
  // set. Unlike PhoneImage's `model`, these aren't interchangeable: pick
  // the one matching the content's own orientation (e.g. a portrait
  // screenshot of the outer display wants 'cover-portrait', not
  // 'cover-landscape').
  variant?: DuoVariant;

  // Rendered width in px at zoom={1}. The frame's full height follows its
  // own aspect ratio automatically - this varies a lot across variants
  // (cover-open is roughly 1.4x wider than tall; inner-portrait over 1.3x
  // taller than wide). Actual on-page width grows with `zoom` (see
  // computeDisplayWidth) - this is the base to scale from, not the final
  // size at zoom > 1.
  width?: number;

  // 1   = full frame visible ("full" view, the default).
  // 2   = zoomed in 2x - the frame and image are scaled up together and
  //       clipped to roughly half their height ("half" view), and the
  //       rendered size grows so the crop stays legible. Combine with
  //       `focus` to pick which half stays in view.
  // 3+  = zoom further for a tighter, larger crop.
  zoom?: number;

  // Which part of the frame (frame + image together) stays in view once
  // zoom > 1. Has no effect at zoom={1}.
  focus?: 'top' | 'center' | 'bottom';

  className?: string;
};

// Same Duo frame/crop as DuoVideo, for placements that need a static
// screenshot instead of a recording (e.g. a single frame that doesn't
// justify a video, or a mockup with no live interaction to capture).
//
// <DuoImage variant="cover-portrait" src="/lock-screen.png" width={240} />
// <DuoImage variant="inner-landscape" src="/split-view.png" width={480} />
//
// Clicking any instance opens the lightbox showing the full, un-cropped
// frame and image, regardless of the zoom/focus used inline.
export function DuoImage({
  src,
  caption,
  variant = DEFAULT_VARIANT,
  width = 280,
  zoom = 1,
  focus = 'center',
  className,
}: DuoImageProps) {
  const frame = getDuoFrame(variant);
  const { screen } = frame;
  const displayWidth = computeDisplayWidth(width, zoom);
  const { phoneHeight, viewportHeight, offsetY, heightPercent, offsetYPercent } =
    computeFrameLayout(displayWidth, zoom, focus, frame.width, frame.height);

  const { ref, open } = useLightboxTrigger({
    src,
    type: 'phone-image',
    width: frame.width,
    height: LIGHTBOX_MATCHES_CROP ? frame.height / zoom : frame.height,
    alt: caption,
    caption,
    frame: {
      src: frame.src,
      width: frame.width,
      height: frame.height,
      ...(LIGHTBOX_MATCHES_CROP ? { offsetYPercent, heightPercent } : {}),
      screen,
    },
  });

  return (
    <button
      type="button"
      ref={ref}
      onClick={open}
      aria-label={caption ? `View ${caption} full size` : 'View full size'}
      className={cn(
        'relative mx-auto block cursor-zoom-in overflow-hidden outline-none',
        className,
      )}
      style={{ width: displayWidth, height: viewportHeight }}
    >
      {/* The frame as one rigid unit (frame + image), always laid out at its
          full natural size, then shifted so the chosen half sits inside the
          (possibly shorter) clipped viewport above. */}
      <div
        className="absolute"
        style={{ top: offsetY, width: displayWidth, height: phoneHeight }}
      >
        <div
          className="absolute overflow-hidden"
          style={{
            top: `${screen.top}%`,
            left: `${screen.left}%`,
            width: `${screen.width}%`,
            height: `${screen.height}%`,
            borderRadius: screenBorderRadius(screen),
          }}
        >
          <Image
            src={src}
            alt={caption || ''}
            fill
            className="object-cover"
            sizes={`${Math.round(displayWidth * (screen.width / 100))}px`}
          />
        </div>

        <Image
          src={frame.src}
          alt=""
          fill
          className="pointer-events-none select-none"
          sizes={`${Math.round(displayWidth)}px`}
        />
      </div>
    </button>
  );
}
