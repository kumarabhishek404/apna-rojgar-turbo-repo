export const metadata = {
  title: "All Services - Apna Rojgar India",
  description:
    "Browse all available services and job opportunities on Apna Rojgar India platform.",
  alternates: {
    canonical: "https://www.apnarojgarindia.com/all-services",
  },
};

import ServicesDashboard from "@/components/webapp/ServicesDashboard";

export default function AllServicesRoutePage() {
  return <ServicesDashboard />;
}
