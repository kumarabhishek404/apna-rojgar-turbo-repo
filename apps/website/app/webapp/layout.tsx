import WebAppNav from "@/components/webapp/WebAppNav";

export default function WebAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <WebAppNav />
        {children}
      </div>
    </main>
  );
}
