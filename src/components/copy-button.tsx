'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type CopyButtonProps = {
  value: string;
  className?: string;
};

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  // Reset the tick back to the copy icon, and cancel the pending timer if the
  // button unmounts (or is clicked again) before it fires.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard access can be refused (insecure origin, denied permission).
      // Nothing useful to recover with, so leave the icon unchanged rather
      // than reporting success that didn't happen.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-accent absolute top-2 right-2 rounded-md p-1.5 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none',
        copied && 'text-foreground opacity-100',
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}
