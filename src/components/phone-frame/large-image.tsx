'use client';

import Image from 'next/image';

import { GalleryItem } from '@/components/phone-frame/image-gallery';
import { cn } from '@/lib/utils';

type LargeImageProps = {
  src: string;
  alt?: string;
  caption?: string;
  width: number;
  height: number;
  wrapperClassName?: string;
  imageClassName?: string;
  className?: string;
};

export function LargeImage({
  src,
  alt,
  caption,
  width,
  height,
  wrapperClassName,
  imageClassName,
  className,
}: LargeImageProps) {
  const label = caption || alt || '';

  return (
    <figure
      className={cn('flex flex-col gap-5', className)}
    >
      <GalleryItem
        original={src}
        thumbnail={src}
        width={width}
        height={height}
        alt={label}
        caption={caption}
      >
        {({ ref, open }) => (
          <button
            type="button"
            ref={ref}
            onClick={open}
            className={cn('cursor-zoom-in outline-none', wrapperClassName)}
            aria-label={
              label ? `View ${label} full size` : 'View image full size'
            }
          >
            <Image
              src={src}
              alt={label}
              width={width}
              height={height}
              className={cn('h-auto w-full rounded-md', imageClassName)}
            />
          </button>
        )}
      </GalleryItem>
      {caption && (
        <figcaption className="text-muted-foreground text-center text-base">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
