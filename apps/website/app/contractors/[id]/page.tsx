import Navbar from "@/components/Navbar";
import ContractorDetailPage from "@/app/webapp/contractors/[id]/page";

export default function ContractorDetailsRoutePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <Navbar />
      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <ContractorDetailPage params={params} />
        </div>
      </div>
    </>
  );
}
