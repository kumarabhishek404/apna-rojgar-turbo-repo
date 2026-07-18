import type { Metadata } from "next";
import AppLandingPage from "@/components/AppLandingPage";

export const metadata: Metadata = {
  title: "Download Apna Rojgar App | Google Play",
  description:
    "Download the Apna Rojgar Android app from Google Play. Find work or hire workers near you across India.",
  alternates: {
    canonical: "https://apnarojgarindia.com/app",
  },
  openGraph: {
    title: "Download Apna Rojgar App",
    description:
      "Get the Apna Rojgar app on Google Play — find work or hire workers near you.",
    url: "https://apnarojgarindia.com/app",
    siteName: "Apna Rojgar",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Download Apna Rojgar App",
    description:
      "Get the Apna Rojgar app on Google Play — find work or hire workers near you.",
  },
};

export default function AppPage() {
  return <AppLandingPage />;
}
