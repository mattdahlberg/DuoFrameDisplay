import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

// Inter feeds shadcn's --font-sans token; Geist Mono stays for code blocks.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DuoFrameDisplay",
  description:
    "Composite screenshots and screen recordings into an iPhone Duo frame - closed, open, portrait or landscape - with zoom/focus cropping and a shared lightbox.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // `dark` is pinned rather than following the system: the harness exists
      // to judge how the frames read, and they're shot against a dark ground.
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
