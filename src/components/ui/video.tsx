import { cn } from '@/lib/utils';

type VideoProps = Omit<
  React.ComponentPropsWithoutRef<'video'>,
  'autoPlay' | 'muted' | 'loop' | 'playsInline' | 'controls'
> & {
  src: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  className?: string;
};

export function Video({
  src,
  className,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  controls = false,
  poster,
  children,
  ...props
}: VideoProps) {
  return (
    <video
      src={src}
      className={cn('h-auto w-full', className)}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      poster={poster}
      {...props}
    >
      {children}
    </video>
  );
}
