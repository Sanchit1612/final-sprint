import type { Metadata, Viewport } from "next";
import "@fontsource-variable/outfit";
import "./globals.css";
import {SiteAnalytics} from '@/components/SiteAnalytics';

export const metadata: Metadata = {
  title: { default: "Fast Sprint — placement prep that tracks itself", template: "%s · Fast Sprint" },
  description: "DSA and Core CS checklists, daily sprint tasks and an application tracker for engineering students preparing for placements.",
};
export const viewport: Viewport = { themeColor: "#0A0A0B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}<SiteAnalytics/></body>
    </html>
  );
}
