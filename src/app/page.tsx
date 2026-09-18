import { Play } from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { DuoImage } from '@/components/phone-frame/duo-image';
import { PageLightboxProvider } from '@/components/phone-frame/page-lightbox';

const COVER = '/demo/placeholder-cover.png';
const COVER_LANDSCAPE = '/demo/placeholder-cover-landscape.png';
const INNER_LANDSCAPE = '/demo/placeholder-inner-landscape.png';
const INNER_PORTRAIT = '/demo/placeholder-inner-portrait.png';

// Local harness. Every section here is one row of the README capability
// table - code on the left, the rendered output on the right - so each
// `id` doubles as the screenshot target for that row.
//
// Content is placeholder art (grid + label, sized to each screen's true
// aspect ratio) until real screenshots/recordings exist - swap the four
// constants above once they do, everything else stays put.
type SectionProps = {
  id: string;
  title: string;
  note: string;
  code: string;
  children: React.ReactNode;
};

// Small mono label under a frame naming the prop value it's demonstrating -
// context that's otherwise only visible by clicking through to the
// lightbox caption.
function LabeledFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <span className="text-muted-foreground font-mono text-xs">{label}</span>
    </div>
  );
}

// Stands in for DuoVideo in the harness: the Duo isn't shipping yet, so
// there's no real recording to show and a fake one would overstate what
// this actually demos. A play icon over a static frame signals "video goes
// here" without implying real footage - swap for an actual <DuoVideo> once
// there's something real to record.
function VideoIntentPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="bg-black/55 rounded-full p-4 backdrop-blur-sm">
          <Play className="size-8 fill-white text-white" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, note, code, children }: SectionProps) {
  return (
    <section id={id} className="border-border scroll-mt-8 border-t py-14">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-2 md:items-start">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{note}</p>
          <div className="group relative">
            <pre className="bg-muted/50 border-border text-foreground scrollbar-thin overflow-x-auto rounded-lg border p-4 pr-12 font-mono text-xs leading-relaxed">
              <code>{code}</code>
            </pre>
            <CopyButton value={code} />
          </div>
        </div>
        <div className="flex flex-wrap items-start justify-center gap-6">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function Harness() {
  return (
    <PageLightboxProvider>
      <main className="pb-24">
        <header className="mx-auto max-w-5xl px-6 pt-16 pb-4">
          <h1 className="text-4xl font-bold tracking-tight">Duo Frame Display</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
            Development harness. Each section below is a capability example —
            click any frame to open the shared lightbox. Content shown is
            placeholder art until real screenshots/recordings are swapped in.
          </p>
        </header>

        <Section
          id="cover-portrait"
          title='variant="cover-portrait"'
          note="Closed, outer 5.4&quot; display facing you."
          code={`<DuoImage
  variant="cover-portrait"
  src="/outer-lock-screen.png"
  width={200}
/>`}
        >
          <LabeledFrame label='variant="cover-portrait"'>
            <DuoImage
              variant="cover-portrait"
              src={COVER}
              caption="Cover, portrait"
              width={200}
            />
          </LabeledFrame>
        </Section>

        <Section
          id="cover-open"
          title='variant="cover-open"'
          note="Same outer display and same screen cutout as cover-portrait, shown from an angle where the other half of the frame is the phone's closed back panel instead of background."
          code={`<DuoImage
  variant="cover-open"
  src="/outer-lock-screen.png"
  width={280}
/>`}
        >
          <LabeledFrame label='variant="cover-open"'>
            <DuoImage
              variant="cover-open"
              src={COVER}
              caption="Cover, open angle"
              width={280}
            />
          </LabeledFrame>
        </Section>

        <Section
          id="cover-landscape"
          title='variant="cover-landscape"'
          note="Outer display again, device rotated - needs its own landscape-oriented content, not the portrait cover image rotated in CSS."
          code={`<DuoImage
  variant="cover-landscape"
  src="/outer-landscape.png"
  width={280}
/>`}
        >
          <LabeledFrame label='variant="cover-landscape"'>
            <DuoImage
              variant="cover-landscape"
              src={COVER_LANDSCAPE}
              caption="Cover, landscape"
              width={280}
            />
          </LabeledFrame>
        </Section>

        <Section
          id="inner-landscape"
          title='variant="inner-landscape"'
          note="Open, inner 7.6&quot; display - both halves combined into one continuous screen, the way the real device works unfolded."
          code={`<DuoImage
  variant="inner-landscape"
  src="/split-view.png"
  width={320}
/>`}
        >
          <LabeledFrame label='variant="inner-landscape"'>
            <DuoImage
              variant="inner-landscape"
              src={INNER_LANDSCAPE}
              caption="Inner, landscape"
              width={320}
            />
          </LabeledFrame>
        </Section>

        <Section
          id="inner-portrait"
          title='variant="inner-portrait"'
          note="Same inner display, device rotated to portrait."
          code={`<DuoImage
  variant="inner-portrait"
  src="/inner-portrait.png"
  width={220}
/>`}
        >
          <LabeledFrame label='variant="inner-portrait"'>
            <DuoImage
              variant="inner-portrait"
              src={INNER_PORTRAIT}
              caption="Inner, portrait"
              width={220}
            />
          </LabeledFrame>
        </Section>

        <Section
          id="duo-video"
          title="DuoVideo"
          note="Same geometry as DuoImage, for a screen recording instead of a screenshot. Loads lazily on scroll and shows its generated poster until then - run npm run generate-posters after adding one."
          code={`<DuoVideo
  variant="inner-landscape"
  src="/demo.mp4"
  width={320}
/>`}
        >
          <LabeledFrame label='variant="inner-landscape"'>
            <VideoIntentPreview>
              <DuoImage
                variant="inner-landscape"
                src={INNER_LANDSCAPE}
                caption="Inner landscape, video"
                width={320}
              />
            </VideoIntentPreview>
          </LabeledFrame>
        </Section>

        <Section
          id="zoom-focus"
          title="zoom / focus"
          note="zoom crops in, focus picks which slice stays in view. Works the same on landscape variants."
          code={`<DuoImage variant="inner-landscape" src="..." width={320} zoom={2} focus="top" />
<DuoImage variant="inner-landscape" src="..." width={320} zoom={2} focus="bottom" />`}
        >
          <LabeledFrame label='focus="top"'>
            <DuoImage
              variant="inner-landscape"
              src={INNER_LANDSCAPE}
              caption="Inner landscape, top half"
              width={320}
              zoom={2}
              focus="top"
            />
          </LabeledFrame>

          {/* Separates the two crops so they read as independent examples,
              not as one image split top/bottom - they're both the full
              screenshot, just cropped and re-centred differently. */}
          <div className="border-border my-2 w-full max-w-xs border-t" />

          <LabeledFrame label='focus="bottom"'>
            <DuoImage
              variant="inner-landscape"
              src={INNER_LANDSCAPE}
              caption="Inner landscape, bottom half"
              width={320}
              zoom={2}
              focus="bottom"
            />
          </LabeledFrame>
        </Section>
      </main>
    </PageLightboxProvider>
  );
}
