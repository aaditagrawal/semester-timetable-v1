import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/lib/theme-provider";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timetable | MIT Manipal IT_CCE",
  description: "Personal timetable viewer for MIT Manipal School of Computer Engineering",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Timetable" },
  applicationName: "Timetable",
};

/** Standalone PWA sizing: fill notched screens and match the app's chrome. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/**
 * Applies the saved theme before first paint. The custom properties were
 * serialised by the ThemeProvider when they were last changed, so this replays
 * a cached string rather than duplicating the palette derivation — without it,
 * a customised theme flashes the shipped dark palette on every load.
 */
const themeBootstrap = `try{var d=document.documentElement,m=localStorage.getItem("theme");d.classList.toggle("dark",m!=="light");var v=localStorage.getItem("timetable-theme-vars");if(v)d.style.cssText=v}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning: the bootstrap script writes class and style on
  // <html> before React hydrates, which is a mismatch by definition — that is
  // the whole point of it.
  return (
    <html lang="en" className={`${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script defer src="https://stat.sys256.com/script.js" strategy="afterInteractive" />
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
