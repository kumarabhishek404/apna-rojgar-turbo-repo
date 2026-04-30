export const metadata = {
  title: "My Profile - Apna Rojgar India",
  description: "View and update your profile details on Apna Rojgar India. Showcase your skills and personal information.",
  alternates: {
    canonical: "https://www.apnarojgarindia.com/my-profile",
  },
};

import ServicesDashboard from "@/components/webapp/ServicesDashboard";

export default function MyProfileRoutePage() {
  return <ServicesDashboard />;
}
