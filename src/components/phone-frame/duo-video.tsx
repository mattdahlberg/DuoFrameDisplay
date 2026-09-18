'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

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
import { Video } from '@/components/ui/video';
import { cn } from '@/lib/utils';

// Shown in the screen window until the instance scrolls near the viewport,
// then swapped for the real <video>. Every DuoVideo otherwise mounts and
// autoplays its video immediately on page load regardless of scroll
// position - fine for one instance, expensive with several on one page.
//
// The poster is a real screenshot of the video's own first second rather
// than a generic placeholder, generated at `<name>-poster.jpg` next to the
// source video by `npm run generate-posters` (see
// scripts/generate-video-posters.mjs). Run that script after adding a new
// video src.
function getPosterSrc(src: string) {
  return src.replace(/\.mp4$/, '-poster.jpg');
}

// The recording's own aspect ratio is nearly identical to the screen
// window's, so object-cover has almost no spare crop margin to redistribute
// - changing object-position alone produces no visible movement here.
// Instead, zoom the video in slightly to create real overflow, then
// translate it within that overflow. CONTENT_SCALE creates the room to
// move; CONTENT_OFFSET_Y (in % of the video's own height) does the actual
// shift. Positive Y moves the video content down within the frame.
const CONTENT_SCALE = 1;
const CONTENT_OFFSET_Y = 0;

type DuoVideoProps = {
  src: string;
  // Shown in the lightbox caption when the framed view is opened full size.
  caption?: string;

  // --- Adjust these per placement, everything else can stay put ---

  // Which physical state to composite into - see DUO_VARIANTS for the full
  // set. Unlike PhoneVideo's `model`, these aren't interchangeable: pick
  // the one matching the recording's own orientation.
  variant?: DuoVariant;

  // Rendered width in px at zoom={1}. The frame's full height follows its
  // own aspect ratio automatically. Actual on-page width grows with `zoom`
  // (see computeDisplayWidth) - this is the base to scale from, not the
  // final size at zoom > 1.
  width?: number;

  // 1   = full frame visible ("full" view, the default).
  // 2   = zoomed in 2x - the frame and video are scaled up together and
  //       clipped to roughly half their height ("half" view), and the
  //       rendered size grows so the crop stays legible. Combine with
  //       `focus` to pick which half stays in view.
  // 3+  = zoom further for a tighter, larger crop.
  zoom?: number;

  // Which part of the frame (frame + video together) stays in view once
  // zoom > 1. Has no effect at zoom={1}.
  focus?: 'top' | 'center' | 'bottom';

  className?: string;
};

// "Double" view (two frames, same or different recordings, side by side):
// drop two of these side by side, e.g.
//
// <DuoVideo variant="inner-landscape" src="/demo.mp4" width={480} zoom={2} focus="top" />
// <DuoVideo variant="inner-landscape" src="/demo.mp4" width={480} zoom={2} focus="bottom" />
//
// Clicking any instance opens the lightbox showing the full, un-cropped
// frame and video, regardless of the zoom/focus used inline.
export function DuoVideo({
  src,
  caption,
  variant = DEFAULT_VARIANT,
  width = 280,
  zoom = 1,
  focus = 'center',
  className,
}: DuoVideoProps) {
  const frame = getDuoFrame(variant);
  const { screen } = frame;
  const displayWidth = computeDisplayWidth(width, zoom);
  const { phoneHeight, viewportHeight, offsetY, heightPercent, offsetYPercent } =
    computeFrameLayout(displayWidth, zoom, focus, frame.width, frame.height);
  const posterSrc = getPosterSrc(src);

  const { ref, open } = useLightboxTrigger({
    src,
    type: 'phone-video',
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

  // Swap the poster for the real <video> once this instance is near the
  // viewport, rather than every instance loading and autoplaying at once.
  const [isNearViewport, setIsNearViewport] = useState(false);
  const containerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      containerRef.current = node;
      ref(node);
    },
    [ref],
  );

  return (
    <button
      type="button"
      ref={setRefs}
      onClick={open}
      aria-label={caption ? `View ${caption} full size` : 'View full size'}
      className={cn(
        'relative mx-auto block cursor-zoom-in overflow-hidden outline-none',
        className,
      )}
      style={{ width: displayWidth, height: viewportHeight }}
    >
      {/* The frame as one rigid unit (frame + video), always laid out at its
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
          {isNearViewport ? (
            <Video
              src={src}
              poster={posterSrc}
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${CONTENT_SCALE}) translateY(${CONTENT_OFFSET_Y}%)`,
              }}
            />
          ) : (
            <Image
              src={posterSrc}
              alt=""
              fill
              className="object-cover"
              style={{
                transform: `scale(${CONTENT_SCALE}) translateY(${CONTENT_OFFSET_Y}%)`,
              }}
              sizes={`${Math.round(displayWidth * (screen.width / 100))}px`}
            />
          )}
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
