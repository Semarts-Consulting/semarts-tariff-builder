import { ReportsSummary } from "@/components/ReportsSummary";
import { SectionHeader } from "@/components/SectionHeader";

export default async function ReportsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <SectionHeader
        title="Reports"
        description="Review the tariff schedule, methodology assumptions, and calculation checks for this project."
      />
      <ReportsSummary projectId={projectId} />
    </div>
  );
}
