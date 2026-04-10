import Navbar from "@/components/Navbar";
import ContractorDetailView from "@/components/webapp/ContractorDetailView";
import { staticExportDynamicParamList } from "@/lib/staticExportDynamicRoutes";

export function generateStaticParams(): { id: string }[] {
  return staticExportDynamicParamList();
}

export default async function ContractorDetailsRoutePage({
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
          <ContractorDetailView id={id} />
        </div>
      </div>
    </>
  );
}
