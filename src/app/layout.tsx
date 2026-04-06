import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: " Traffic simulation",
  description: "A traffic simulation project built with React, Three.js, and Next.js. It features a dynamic traffic light system that adapts to real-time traffic conditions, providing an interactive and visually engaging experience. The simulation includes multiple camera angles for an immersive view of the traffic flow, making it an ideal tool for studying and optimizing urban traffic management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full m-0 p-0  flex flex-col">{children}</body>
    </html>
  );
}
