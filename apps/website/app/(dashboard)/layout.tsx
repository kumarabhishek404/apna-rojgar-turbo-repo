import ServicesDashboard from "@/components/webapp/ServicesDashboard";

/**
 * Persists the dashboard shell (sidebar + profile) across route changes.
 * Individual pages under (dashboard)/ only exist for URLs/metadata — content
 * is rendered inside ServicesDashboard via pathname.
 */
export default function DashboardShellLayout() {
  return <ServicesDashboard />;
}
