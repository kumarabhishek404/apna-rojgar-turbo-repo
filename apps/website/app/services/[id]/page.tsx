import Navbar from "@/components/Navbar";
import ServiceDetailsView from "@/components/webapp/ServiceDetailsView";
import { staticExportDynamicParamList } from "@/lib/staticExportDynamicRoutes";

export function generateStaticParams(): { id: string }[] {
  return staticExportDynamicParamList();
}

export default async function ServiceDetailsRoutePage({
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
          <ServiceDetailsView id={id} />
        </div>
      </div>
    </>
  );
}
