import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NyayaMitra — Your Bureaucracy Navigator",
  description:
    "An agentic AI system that handles Indian government bureaucracy for the 700M citizens who can't afford a lawyer.",
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
          {children}
        </div>
      </body>
    </html>
  );
}
