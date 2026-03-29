import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assistant for Mom",
  description: "A guided AI coach that teaches prompting with warmth, clarity, and healthy skepticism.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
