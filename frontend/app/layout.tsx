import type { Metadata } from "next";
import "./globals.css";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "PaperTrail AI — Your Bureaucracy Navigator",
  description:
    "Agentic AI that navigates Indian government bureaucracy for the 700M citizens who can't afford a lawyer. Multi-agent, multilingual, offline-first, zero cost.",
  keywords: [
    "Indian bureaucracy", "government forms", "Tamil Nadu", "RTI",
    "legal aid", "civic tech", "AI agent", "multilingual",
  ],
  openGraph: {
    title: "PaperTrail AI — Your Bureaucracy Navigator",
    description: "Multi-agent AI that handles every government procedure, form, and follow-up for Indian citizens.",
    url: "https://papertrailai.app",
    siteName: "PaperTrail AI",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PaperTrail AI — Your Bureaucracy Navigator",
    description: "Multi-agent AI that navigates Indian government bureaucracy. Free, open-source, works offline.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  metadataBase: new URL("https://papertrailai.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: DM Serif Display, Source Sans 3, JetBrains Mono, Noto Sans Tamil, Noto Sans Devanagari */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload the primary body font subset so first paint doesn't FOIT */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ivory antialiased font-sans text-text-primary">
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="fixed left-2 top-2 z-[200] -translate-y-16 rounded-[var(--radius-md)] bg-saffron px-4 py-2 text-sm font-semibold text-white shadow-modal transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div id="main-content">
          <PageTransition>{children}</PageTransition>
        </div>
      </body>
    </html>
  );
}
