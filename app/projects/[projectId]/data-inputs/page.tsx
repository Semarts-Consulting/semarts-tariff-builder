import { DataInputsForm } from "@/components/DataInputsForm";
import { SectionHeader } from "@/components/SectionHeader";
import { WorkbookCustomerInputsForm } from "@/components/WorkbookMethodologyForms";

export default async function DataInputsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <SectionHeader
        title="Data inputs"
        description="Capture the customer class demand and consumption assumptions used by the tariff model."
      />
      <DataInputsForm projectId={projectId} />
      <WorkbookCustomerInputsForm projectId={projectId} />
    </div>
  );
}
