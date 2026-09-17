'use client';

import 'photoswipe/dist/photoswipe.css';
import './page-lightbox.css';

import PhotoSwipeLightbox from 'photoswipe/lightbox';
import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export type LightboxMediaType = 'image' | 'video' | 'phone-video' | 'phone-image';

// Generic "content composited inside a device frame" config. Kept free of
// any specific frame's measurements - the caller (e.g. PhoneVideo,
// PhoneImage) supplies its own frame image and screen-cutout geometry.
export type LightboxFrame = {
  src: string;
  width: number;
  height: number;
  // Where the frame (and its screen) sits within the slide, as a % of the
  // slide's own box - lets the caller show a cropped portion of a taller
  // frame instead of the whole thing. 0 / 100 (the defaults) render the
  // frame at its natural size with no crop.
  offsetYPercent?: number;
  heightPercent?: number;
  screen: {
    top: number;
    left: number;
    width: number;
    height: number;
    radiusX: number;
    radiusY: number;
  };
};

type LightboxEntry = {
  id: string;
  type: LightboxMediaType;
  src: string;
  width: number;
  height: number;
  alt?: string;
  caption?: string;
  element: HTMLElement | null;
  frame?: LightboxFrame;
};

type SlideData = {
  src?: string;
  msrc?: string;
  html?: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  element?: HTMLElement;
  mediaType?: LightboxMediaType;
};

function getThumbMedia(
  element: HTMLElement | null | undefined,
): HTMLElement | null {
  if (!element) return null;
  if (element.matches('img, video')) return element;
  return element.querySelector<HTMLElement>('img, video');
}

const entries = new Map<string, LightboxEntry>();

let openLightbox:
  | ((id: string, point?: { x: number; y: number }) => void)
  | null = null;

function getSortedEntries() {
  return [...entries.values()].sort((a, b) => {
    if (!a.element || !b.element) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function toSlideData(entry: LightboxEntry): SlideData {
  const alt = entry.alt || entry.caption || '';
  const thumb = getThumbMedia(entry.element);

  if ((entry.type === 'phone-video' || entry.type === 'phone-image') && entry.frame) {
    const { frame } = entry;
    const contentSrc = escapeAttribute(entry.src);
    const frameSrc = escapeAttribute(frame.src);
    const { screen } = frame;
    const offsetYPercent = frame.offsetYPercent ?? 0;
    const heightPercent = frame.heightPercent ?? 100;
    const content =
      entry.type === 'phone-video'
        ? `<video src="${contentSrc}" style="width:100%;height:100%;object-fit:cover" playsinline autoplay muted loop></video>`
        : `<img src="${contentSrc}" alt="" style="width:100%;height:100%;object-fit:cover" />`;

    return {
      html: `<div class="pswp__phone-video-slide" style="position:relative;width:100%;height:100%;overflow:hidden">
        <div style="position:absolute;top:${offsetYPercent}%;left:0;width:100%;height:${heightPercent}%">
          <div style="position:absolute;overflow:hidden;top:${screen.top}%;left:${screen.left}%;width:${screen.width}%;height:${screen.height}%;border-radius:${screen.radiusX}% / ${screen.radiusY}%">
            ${content}
          </div>
          <img src="${frameSrc}" alt="" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" />
        </div>
      </div>`,
      width: entry.width,
      height: entry.height,
      alt,
      caption: entry.caption,
      element: entry.element ?? undefined,
      mediaType: entry.type === 'phone-video' ? 'video' : 'image',
    };
  }

  if (entry.type === 'video') {
    const src = escapeAttribute(entry.src);
    return {
      html: `<div class="pswp__video-slide"><video src="${src}" controls playsinline autoplay muted loop></video></div>`,
      width: entry.width,
      height: entry.height,
      alt,
      caption: entry.caption,
      element: entry.element ?? undefined,
      mediaType: 'video',
    };
  }

  const decodedThumb =
    thumb instanceof HTMLImageElement
      ? thumb.currentSrc || thumb.src
      : entry.src;

  return {
    src: entry.src,
    // Already-decoded in-page image (often /_next/image) — zoom placeholder with alpha.
    msrc: decodedThumb,
    width: entry.width,
    height: entry.height,
    alt,
    caption: entry.caption,
    element: entry.element ?? undefined,
    mediaType: 'image',
  };
}

function pauseVideos(root: ParentNode | null | undefined) {
  root?.querySelectorAll('video').forEach((video) => {
    video.pause();
  });
}

function playVideoIn(root: ParentNode | null | undefined) {
  const video = root?.querySelector('video');
  void video?.play().catch(() => undefined);
}

export function PageLightboxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lightbox = new PhotoSwipeLightbox({
      pswpModule: () => import('photoswipe'),
      padding: { top: 24, bottom: 64, left: 16, right: 16 },
      bgOpacity: 1,
    });

    lightbox.on('uiRegister', () => {
      const ui = lightbox.pswp?.ui;
      if (!ui) return;

      ui.registerElement({
        name: 'custom-caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        html: '',
        onInit: (el, pswp) => {
          el.style.cssText =
            'position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);max-width:min(40rem,90%);padding:0.25rem 0.75rem;color:#fff;font-size:0.875rem;line-height:1.4;text-align:center;text-shadow:0 1px 2px rgb(0 0 0 / 60%);pointer-events:none;';

          const update = () => {
            const data = pswp.currSlide?.data as SlideData | undefined;
            el.textContent = data?.caption || data?.alt || '';
          };

          pswp.on('change', update);
          update();
        },
      });
    });

    // Zoom needs a placeholder. Use the decoded thumb image (keeps alpha) instead of
    // PhotoSwipe's default solid #222 div. Videos get a transparent div (see CSS).
    lightbox.addFilter('useContentPlaceholder', (_use, content) => {
      const data = content.data as SlideData;
      return data.mediaType === 'image' || data.mediaType === 'video';
    });

    lightbox.addFilter('placeholderSrc', (_placeholderSrc, content) => {
      const data = content.data as SlideData;
      if (data.mediaType === 'video' || data.html) return false;
      return data.msrc || data.src || false;
    });

    lightbox.addFilter('thumbEl', (thumbEl, data) => {
      const media = getThumbMedia((data as SlideData).element);
      if (media) return media;
      if (thumbEl) return thumbEl;
      // PhotoSwipe types require an element; unused when no thumb bounds exist.
      return document.createElement('div');
    });

    lightbox.on('change', () => {
      pauseVideos(lightbox.pswp?.container);
      playVideoIn(lightbox.pswp?.currSlide?.container);
    });

    // Opening the lightbox directly at a non-first slide (e.g. clicking a
    // cropped PhoneVideo instance) doesn't fire 'change', and pswp.currSlide
    // isn't reliably set yet at that point either - so 'change' alone misses
    // it. This fires per-content the moment it's actually attached, with the
    // element handed to us directly.
    lightbox.on('contentAppend', (e) => {
      if (e.content.slide?.isActive) {
        playVideoIn(e.content.element);
      }
    });

    lightbox.on('close', () => {
      pauseVideos(lightbox.pswp?.container);
    });

    lightbox.init();

    openLightbox = (id, point) => {
      const sorted = getSortedEntries();
      const index = sorted.findIndex((entry) => entry.id === id);
      if (index === -1) return;

      lightbox.loadAndOpen(index, sorted.map(toSlideData), point ?? null);
    };

    return () => {
      openLightbox = null;
      lightbox.destroy();
    };
  }, []);

  return children;
}

type LightboxTriggerOptions = {
  src: string;
  type?: LightboxMediaType;
  width: number;
  height: number;
  alt?: string;
  caption?: string;
  // Only used when type is 'phone-video'.
  frame?: LightboxFrame;
};

export function useLightboxTrigger({
  src,
  type = 'image',
  width,
  height,
  alt,
  caption,
  frame,
}: LightboxTriggerOptions) {
  const id = useId();
  const elementRef = useRef<HTMLElement | null>(null);
  const [contentSize, setContentSize] = useState({ width, height });

  // Reset to the passed dimensions when the source changes, adjusting state
  // during render rather than in an effect - resetting in an effect renders
  // one frame at the stale size first, and trips react-hooks/set-state-in-effect.
  const sizeKey = `${src}|${type}|${width}|${height}`;
  const [prevSizeKey, setPrevSizeKey] = useState(sizeKey);
  if (sizeKey !== prevSizeKey) {
    setPrevSizeKey(sizeKey);
    setContentSize({ width, height });
  }

  useEffect(() => {
    // The frame's own dimensions (already adjusted for zoom) are exactly
    // what we want to display - looking up the raw video/image's natural
    // size here would overwrite that with the wrong aspect ratio for any
    // zoom other than 1, distorting the frame in the lightbox.
    if (type === 'phone-video' || type === 'phone-image') return;

    if (type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setContentSize({
            width: video.videoWidth,
            height: video.videoHeight,
          });
        }
      };
      video.src = src;
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setContentSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    };
    img.src = src;
  }, [src, type]);

  useEffect(() => {
    entries.set(id, {
      id,
      type,
      src,
      width: contentSize.width,
      height: contentSize.height,
      alt,
      caption,
      element: elementRef.current,
      frame,
    });

    return () => {
      entries.delete(id);
    };
  }, [id, type, src, contentSize.width, contentSize.height, alt, caption, frame]);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;
      const entry = entries.get(id);
      if (entry) {
        entry.element = node;
      }
    },
    [id],
  );

  const open = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      const entry = entries.get(id);
      if (entry) {
        entry.element = elementRef.current;
      }
      openLightbox?.(id, { x: event.clientX, y: event.clientY });
    },
    [id],
  );

  return { ref, open, contentSize };
}
