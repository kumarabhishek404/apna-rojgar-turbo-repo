import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import AuthBootstrap from "@/components/AuthBootstrap";
import SocialWall from "@/components/SocialWall";
import WebsiteActivityTracker from "@/components/WebsiteActivityTracker";
import { Suspense } from "react";

export const metadata = {
  title: "Apna Rojgar | Find Work Opportunities",
  description:
    "Apna Rojgar connects workers and businesses across India. Discover jobs, hire workers, and grow together.",
  keywords: ["jobs in india", "hire workers", "rojgar app", "find labour"],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Apna Rojgar",
    description: "Connecting Workers with Opportunities",
    url: "https://apnarojgarindia.com",
    siteName: "Apna Rojgar",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Apna Rojgar",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };

  return (
    <html lang="hi" translate="no">
      <head>
        {/* Suppress browser-native translation (e.g. Chrome's Google Translate bar).
            The site ships its own language switcher, so automatic translation would
            conflict with it and produce double-translated or garbled text. */}
        <meta name="google" content="notranslate" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      </head>

      <body className="bg-gradient-to-b from-white to-gray-50">
        <LanguageProvider>
          <AuthBootstrap />
          <Suspense fallback={null}>
            <WebsiteActivityTracker />
          </Suspense>
          <SocialWall />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}