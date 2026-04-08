import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-[#22409a]">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Use profile page to update language, role, and account settings.
          </p>
        </div>
      </main>
    </>
  );
}
