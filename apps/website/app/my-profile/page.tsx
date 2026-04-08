import Navbar from "@/components/Navbar";
import ProfilePage from "@/app/webapp/profile/page";

export default function MyProfileRoutePage() {
  return (
    <>
      <Navbar />
      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <ProfilePage />
        </div>
      </div>
    </>
  );
}
