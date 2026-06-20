import { CostPoolsForm } from "@/components/CostPoolsForm";
import { SectionHeader } from "@/components/SectionHeader";
import { WorkbookCostInputsForm } from "@/components/WorkbookMethodologyForms";

export default async function CostPoolsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <SectionHeader
        title="Cost pools"
        description="Capture recoverable cost categories used to determine the private network revenue requirement."
      />
      <CostPoolsForm projectId={projectId} />
      <WorkbookCostInputsForm projectId={projectId} />
    </div>
  );
}
