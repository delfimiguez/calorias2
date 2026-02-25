import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Cut Tracker",
  description: "Track calories, macros, and fat loss progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
