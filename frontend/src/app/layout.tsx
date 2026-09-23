import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "GuildPilot | Discord Onboarding & Community Journey Platform",
  description: "Automate member onboarding, role mappings, and channel access with durable Discord interaction state machines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#1E1F22] text-[#DBDEE1] flex flex-col min-h-screen selection:bg-[#5865F2] selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
