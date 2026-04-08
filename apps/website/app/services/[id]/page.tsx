import Navbar from "@/components/Navbar";
import ServiceDetailsPage from "@/app/webapp/services/[id]/page";

export default function ServiceDetailsRoutePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <Navbar />
      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <ServiceDetailsPage params={params} />
        </div>
      </div>
    </>
  );
}
