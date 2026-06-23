import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMPG - Social Media Post Generator",
  description: "AI-powered social media content creation tool",
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
