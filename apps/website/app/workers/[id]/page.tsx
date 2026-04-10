import Navbar from "@/components/Navbar";
import WorkerDetailView from "@/components/webapp/WorkerDetailView";
import { staticExportDynamicParamList } from "@/lib/staticExportDynamicRoutes";

export function generateStaticParams(): { id: string }[] {
  return staticExportDynamicParamList();
}

export default async function WorkerDetailsRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Navbar />
      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <WorkerDetailView id={id} />
        </div>
      </div>
    </>
  );
}
