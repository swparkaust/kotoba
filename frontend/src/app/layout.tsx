import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kotoba — Learn Japanese",
  description: "Learn Japanese the way children do — free, ad-free, guilt-free.",
  manifest: "/manifest.json",
  themeColor: "#E85D3A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#E85D3A" />
        <link rel="icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        <main className="max-w-lg mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
