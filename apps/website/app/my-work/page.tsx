import Navbar from "@/components/Navbar";
import MyWorkPage from "@/app/webapp/my-services/page";

export default function MyWorkRoutePage() {
  return (
    <>
      <Navbar />
      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <MyWorkPage />
        </div>
      </div>
    </>
  );
}
