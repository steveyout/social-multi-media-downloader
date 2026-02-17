import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Youplex | Professional Media Downloader",
        template: "%s | Youplex"
    },
    description: "Download high-quality video and audio from 1000+ sites including YouTube, TikTok, and Instagram. Free, fast, and private.",
    keywords: ["video downloader", "youtube mp3 converter", "download tiktok without watermark", "high quality video download", "youplex"],
    authors: [{ name: "Youplex Team" }],
    metadataBase: new URL("https://youplex.cc"), // Replace with your actual domain
    openGraph: {
        title: "Youplex | High-Performance Media Downloader",
        description: "Fetch content in 4K or 320kbps audio instantly.",
        url: "https://youplex.cc",
        siteName: "Youplex",
        images: [
            {
                url: "/og-image.png", // Put a 1200x630 image in your /public folder
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Youplex | Best Media Downloader",
        description: "Download high-quality media from 1000+ supported sites.",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
    }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Youplex",
        "operatingSystem": "All",
        "applicationCategory": "MultimediaApplication",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1024"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

  return (
    <html lang="en">
    <head>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    {/* Replace 'G-XXXXXXXXXX' with your actual Measurement ID */}
    <GoogleAnalytics gaId="G-84RRQS4TM5" />
    </html>
  );
}
