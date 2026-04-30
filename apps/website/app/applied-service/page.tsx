export const metadata = {
  title: "Applied Works - Apna Rojgar India",
  description: "View all the jobs and services you have applied for on Apna Rojgar India. Track your applications easily.",
  alternates: {
    canonical: "https://www.apnarojgarindia.com/applied-service",
  },
};

import ServicesDashboard from "@/components/webapp/ServicesDashboard";

export default function AppliedServiceRoutePage() {
  return <ServicesDashboard />;
}
