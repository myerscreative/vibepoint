import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibepoint - Your Personal Mood Operating System",
  description: "Track your mood through three controllable inputs: focus, self-talk, and body. Discover patterns and learn to feel exactly how you want.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vibepoint",
  },
  applicationName: "Vibepoint",
  keywords: ["mood tracking", "emotional wellbeing", "mental health", "self-awareness", "mindfulness"],
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vibepoint" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
