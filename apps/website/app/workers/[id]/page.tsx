import Navbar from "@/components/Navbar";
import WorkerDetailPage from "@/app/webapp/workers/[id]/page";

export default function WorkerDetailsRoutePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <Navbar />
      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <WorkerDetailPage params={params} />
        </div>
      </div>
    </>
  );
}
