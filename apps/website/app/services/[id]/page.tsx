import Navbar from "@/components/Navbar";
import ServiceDetailsView from "@/components/webapp/ServiceDetailsView";
import { staticExportDynamicParamListAsync } from "@/lib/staticExportDynamicRoutes";

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return staticExportDynamicParamListAsync();
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
