import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
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
    <html lang="ta">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${lexend.variable} font-lexend antialiased`}
        style={{ fontFamily: "'Lexend', sans-serif" }}
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
