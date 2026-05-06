import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NyayaMitra - Your Bureaucracy Navigator",
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
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
