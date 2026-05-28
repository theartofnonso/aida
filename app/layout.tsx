import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aida. Figure out what to do with your money.",
  description:
    "Aida is an AI financial coach that helps you understand your position, prioritise what matters, and take one confident next step.",
};

export const viewport: Viewport = {
  // Match the app's canvas colour so the mobile browser chrome and
  // overscroll-bounce area blend with the page background instead of
  // showing the accent purple.
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
