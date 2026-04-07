import WorkerForm from "@/components/WorkerForm";

export default function GetWorkPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Find Work Without Installing App
        </h1>

        <WorkerForm />
      </div>
    </div>
  );
}
