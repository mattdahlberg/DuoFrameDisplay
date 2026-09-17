'use client';

import { useLightboxTrigger } from '@/components/phone-frame/page-lightbox';
import { Video } from '@/components/ui/video';
import { cn } from '@/lib/utils';

type LightboxVideoProps = Omit<
  React.ComponentPropsWithoutRef<typeof Video>,
  'src'
> & {
  src: string;
  caption?: string;
  /** Fallback ratio until metadata loads */
  width?: number;
  height?: number;
};

export function LightboxVideo({
  src,
  caption,
  className,
  width = 1920,
  height = 1080,
  ...props
}: LightboxVideoProps) {
  const { ref, open, contentSize } = useLightboxTrigger({
    src,
    type: 'video',
    width,
    height,
    alt: caption,
    caption,
  });

  const isPortrait = contentSize.height > contentSize.width;

  return (
    <figure className="flex flex-col items-center gap-5">
      <button
        type="button"
        ref={ref}
        onClick={open}
        className={cn(
          'bg-muted cursor-zoom-in overflow-hidden rounded-md outline-none',
          isPortrait
            ? 'mx-auto h-[min(70vh,36rem)] w-auto max-w-full'
            : 'w-full',
        )}
        style={{
          aspectRatio: `${contentSize.width} / ${contentSize.height}`,
        }}
        aria-label={
          caption ? `View ${caption} full size` : 'View video full size'
        }
      >
        <Video
          src={src}
          className={cn('size-full object-contain', className)}
          {...props}
        />
      </button>
      {caption && (
        <figcaption className="text-muted-foreground text-center text-base">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
