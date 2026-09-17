'use client';

import { useLightboxTrigger } from '@/components/phone-frame/page-lightbox';

type GalleryItemProps = {
  original: string;
  thumbnail?: string;
  width: number;
  height: number;
  alt?: string;
  caption?: string;
  children: (props: {
    ref: (node: HTMLElement | null) => void;
    open: (event: React.MouseEvent) => void;
  }) => React.ReactNode;
};

/** Registers an image with the page-level lightbox and exposes open/ref. */
export function GalleryItem({
  original,
  width,
  height,
  alt = '',
  caption,
  children,
}: GalleryItemProps) {
  const { ref, open } = useLightboxTrigger({
    src: original,
    width,
    height,
    alt,
    caption,
  });

  return children({ ref, open });
}
