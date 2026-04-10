import WorkerDetailView from "@/components/webapp/WorkerDetailView";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkerDetailView id={id} />;
}
