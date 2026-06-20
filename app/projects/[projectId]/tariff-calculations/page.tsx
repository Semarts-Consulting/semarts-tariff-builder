import { SectionHeader } from "@/components/SectionHeader";
import { TariffCalculationsSummary } from "@/components/TariffCalculationsSummary";

export default async function TariffCalculationsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <SectionHeader
        title="Tariff calculations"
        description="Calculate indicative tariff outputs from recoverable costs, allocation methods, and customer demand data."
      />
      <TariffCalculationsSummary projectId={projectId} />
    </div>
  );
}
