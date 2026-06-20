import { AllocationMethodsForm } from "@/components/AllocationMethodsForm";
import { SectionHeader } from "@/components/SectionHeader";

export default async function AllocationMethodsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <SectionHeader
        title="Allocation methods"
        description="Assign recoverable cost pools to customer classes and tariff components."
      />
      <AllocationMethodsForm projectId={projectId} />
    </div>
  );
}
