import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkGuard - Smart Link Detection",
  description:
    "Smart System for Real-Time Detection of Suspicious Internet Links. Protect yourself from phishing, malware, and fraudulent websites with AI-powered URL analysis.",
  keywords: [
    "LinkGuard",
    "URL scanner",
    "phishing detection",
    "malware detection",
    "link safety",
    "cybersecurity",
    "threat detection",
  ],
  authors: [{ name: "LinkGuard Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
