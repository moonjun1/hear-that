import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Analytics from "@/components/Analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://hear-that.vercel.app";

export const metadata: Metadata = {
  verification: {
    google: "kZJvHav5iCvuX2V3k93Q-_40VuOEC-TK52Uj3WQyEJo",
  },
  title: {
    default: "Hear That? ⚡ 천둥 실시간 반응",
    template: "%s | Hear That?",
  },
  description:
    "천둥이 치면 같은 동네 사람들의 반응을 실시간으로 본다. 번개 위치 추적, 지역 채팅, Thunder Wave 애니메이션.",
  keywords: [
    "천둥",
    "번개",
    "실시간",
    "날씨",
    "반응",
    "지도",
    "채팅",
    "기상청",
    "낙뢰",
    "thunder",
    "lightning",
    "weather",
    "realtime",
  ],
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    title: "Hear That? ⚡ 천둥 실시간 반응",
    description:
      "천둥이 치면 같은 동네 사람들의 반응을 실시간으로 본다",
    siteName: "Hear That?",
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "Hear That? - 천둥 실시간 반응 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hear That? ⚡ 천둥 실시간 반응",
    description:
      "천둥이 치면 같은 동네 사람들의 반응을 실시간으로 본다",
    images: [`${SITE_URL}/api/og`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HearThat",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a1a] text-gray-200">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Hear That?",
              description: "천둥이 치면 같은 동네 사람들의 반응을 실시간으로 본다",
              url: "https://hear-that.vercel.app",
              applicationCategory: "WeatherApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
            }),
          }}
        />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
