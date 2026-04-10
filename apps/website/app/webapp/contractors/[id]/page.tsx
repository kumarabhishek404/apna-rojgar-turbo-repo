import ContractorDetailView from "@/components/webapp/ContractorDetailView";

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContractorDetailView id={id} />;
}
