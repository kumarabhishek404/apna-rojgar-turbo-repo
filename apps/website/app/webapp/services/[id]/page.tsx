import ServiceDetailsView from "@/components/webapp/ServiceDetailsView";

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceDetailsView id={id} />;
}
