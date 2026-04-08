import type { Metadata, Viewport } from "next";
import { Lexend, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-noto-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TVK - தமிழக வெற்றி கழகம் | Campaign Photo Generator",
  description:
    "Take a selfie with Vijay Thalapathy and your TVK candidate! Tamil Nadu Elections 2026 - Tamilaga Vettri Kazhagam Campaign Photo Generator.",
  keywords:
    "TVK, Tamilaga Vettri Kazhagam, Vijay, Tamil Nadu Elections 2026, Campaign Photo",
  openGraph: {
    title: "TVK - தமிழக வெற்றி கழகம்",
    description:
      "Take a selfie with Vijay Thalapathy and your TVK candidate!",
    type: "website",
  },
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ta" translate="no" className="notranslate">
      <head>
      </head>
      <body
        className={`${lexend.variable} ${notoTamil.variable} font-lexend antialiased`}
        style={{ fontFamily: "'Lexend', var(--font-noto-tamil), sans-serif" }}
      >
        {/* Animated gradient background */}
        <div className="hero-gradient" />

        {/* Main content */}
        <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
