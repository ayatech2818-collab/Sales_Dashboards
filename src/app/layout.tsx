import type { Metadata } from "next";
import { Baloo_2, Mukta } from "next/font/google";
import "./globals.css";

// latin-ext carries the ₹ glyph, so preload it alongside latin.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "latin-ext"],
});

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sales Organizer · Home",
  description:
    "Monthly target, rewards, earnings and leaderboard for sales organizers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${mukta.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-sans text-ink">{children}</body>
    </html>
  );
}
