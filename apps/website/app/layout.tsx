import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import AuthBootstrap from "@/components/AuthBootstrap";
import SocialWall from "@/components/SocialWall";
import WebsiteActivityTracker from "@/components/WebsiteActivityTracker";
import WebsiteErrorReporter from "@/components/WebsiteErrorReporter";
import { Suspense } from "react";
import Script from "next/script";

export const metadata = {
  verification: {
    google: "ikFDb0OjKO1OJWinqZL1yJfOC6FFEwZ4XYeZMQtd84E",
  },
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
    "@type": "Organization",
    name: "Apna Rojgar",
    url: "https://apnarojgarindia.com",
    logo: "https://apnarojgarindia.com/logo.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jalesar, Etah Uttar Pradesh, India, 207302",
      addressLocality: "Etah",
      addressRegion: "Uttar Pradesh",
      addressCountry: "India",
      postalCode: "207302",
    },
    email: "info@apnarojgarindia.com",
    phone: "+91 6397308499",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "info@apnarojgarindia.com",
      phone: "+91 6397308499",
    },
    areaServed: "India",
    brand: {
      "@type": "Brand",
      name: "Apna Rojgar",
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61572228340443",
      "https://www.instagram.com/apnarojgarindia/",
      "https://www.linkedin.com/company/apna-rojgar-india/",
      "https://www.youtube.com/@apnarojgarindia",
      "https://www.threads.com/@apnarojgarindia"
    ],
  };

  return (
    <html lang="hi" translate="no">
      <head>
        {/* Suppress browser-native translation (e.g. Chrome's Google Translate bar).
            The site ships its own language switcher, so automatic translation would
            conflict with it and produce double-translated or garbled text. */}
        <meta name="google" content="notranslate" />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S6TZQGWV6J"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;

      gtag('js', new Date());
      gtag('config', 'G-S6TZQGWV6J', {
        send_page_view: false
      });
    `}
        </Script>

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
          <WebsiteErrorReporter>{children}</WebsiteErrorReporter>
        </LanguageProvider>
      </body>
    </html>
  );
}
