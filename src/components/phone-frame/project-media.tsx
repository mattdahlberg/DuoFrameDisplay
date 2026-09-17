import { cn } from '@/lib/utils';

type ProjectMediaProps = {
  children: React.ReactNode;
  className?: string;
};

// Layout helpers only - deliberately free of any page-width or typography
// classes. Wrap these in your own container/prose wrapper; a component
// library shouldn't decide how wide your content column is.

export function ProjectMedia({ children, className }: ProjectMediaProps) {
  return (
    <div className={cn('space-y-15 md:space-y-18', className)}>{children}</div>
  );
}

export function ProjectImageGrid({ children, className }: ProjectMediaProps) {
  return (
    <div className={cn('flex flex-wrap justify-center gap-10', className)}>
      {children}
    </div>
  );
}
