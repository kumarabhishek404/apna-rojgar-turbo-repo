import Navbar from "@/components/Navbar";
import AppliedServicesPage from "@/app/webapp/applied-services/page";

export default function AppliedServiceRoutePage() {
  return (
    <>
      <Navbar />
      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <AppliedServicesPage />
        </div>
      </div>
    </>
  );
}
