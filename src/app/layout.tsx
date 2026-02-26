import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Viewport config — viewport-fit=cover lets content extend under iPhone notch/Dynamic Island,
// then we use CSS env(safe-area-inset-*) to pad content back into the safe zone.
// maximumScale=1 prevents iOS from auto-zooming on input focus.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

// TODO: Update metadataBase with your live domain
export const metadata: Metadata = {
  title: "Accuracy Flux | Practice Management",
  description: "Modern accounting practice management platform. Manage clients, automate workflows, track time, and grow your practice.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Accuracy Flux | Practice Management",
    description:
      "Modern accounting practice management platform. Manage clients, automate workflows, track time, and grow your practice.",
    siteName: "Accuracy Flux",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accuracy Flux | Practice Management",
    description:
      "Modern accounting practice management. Manage clients, automate workflows, track time, and grow your practice.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
