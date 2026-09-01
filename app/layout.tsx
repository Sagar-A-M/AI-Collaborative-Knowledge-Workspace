import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { ToastProvider } from "@/components/ui/toast";
import { CommandPalette } from "@/components/ui/command-palette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Collaborative Knowledge Workspace",
  description:
    "Next-generation collaborative knowledge base and document intelligence platform for high-velocity teams.",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "google-site-verification-token",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <WorkspaceProvider>
            <ToastProvider>
              {children}
              <CommandPalette />
            </ToastProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
